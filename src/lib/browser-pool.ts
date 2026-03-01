/**
 * Puppeteer 浏览器实例复用池
 *
 * 核心优化：不再为每次封面渲染启动/关闭一个完整的浏览器进程，
 * 而是维护一个常驻的浏览器实例，每次渲染只创建/关闭一个 Page（标签页），
 * 大幅降低启动开销（从 ~2s 降至 ~200ms）。
 *
 * 并发控制：通过信号量限制同时渲染的页面数量，防止资源耗尽。
 */

import puppeteer, { Browser } from 'puppeteer-core'

/** 从环境变量读取 Chromium 路径，提供合理的默认值 */
const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH ||
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/usr/bin/chromium-browser'

/** 最大并发渲染页面数 */
const MAX_CONCURRENT_PAGES = parseInt(process.env.MAX_CONCURRENT_RENDERS || '3', 10)

/** 浏览器空闲超时（毫秒），超时后关闭浏览器以释放内存 */
const IDLE_TIMEOUT_MS = parseInt(process.env.BROWSER_IDLE_TIMEOUT_MS || '300000', 10) // 5分钟

interface BrowserPoolState {
  browser: Browser | null
  launching: boolean
  launchPromise: Promise<Browser> | null
  activeTasks: number
  idleTimer: ReturnType<typeof setTimeout> | null
}

// 使用 globalThis 确保在 Next.js 热重载时不会创建多个实例
const g = globalThis as unknown as { __browserPool?: BrowserPoolState }

function getPool(): BrowserPoolState {
  if (!g.__browserPool) {
    g.__browserPool = {
      browser: null,
      launching: false,
      launchPromise: null,
      activeTasks: 0,
      idleTimer: null,
    }
  }
  return g.__browserPool
}

/** 启动 Puppeteer 浏览器（带去重保护） */
async function launchBrowser(): Promise<Browser> {
  const pool = getPool()
  if (pool.browser) return pool.browser
  if (pool.launchPromise) return pool.launchPromise

  pool.launchPromise = puppeteer
    .launch({
      executablePath: CHROMIUM_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
      ],
      headless: true,
    })
    .then((browser) => {
      pool.browser = browser
      pool.launchPromise = null
      // 监听意外关闭，清理状态
      browser.on('disconnected', () => {
        pool.browser = null
        pool.launchPromise = null
        console.log('[BrowserPool] Browser disconnected, will relaunch on next request.')
      })
      return browser
    })
    .catch((err) => {
      pool.launchPromise = null
      throw err
    })

  return pool.launchPromise
}

/** 重置空闲计时器 */
function resetIdleTimer() {
  const pool = getPool()
  if (pool.idleTimer) clearTimeout(pool.idleTimer)
  pool.idleTimer = setTimeout(async () => {
    const p = getPool()
    if (p.activeTasks === 0 && p.browser) {
      console.log('[BrowserPool] Idle timeout, closing browser.')
      await p.browser.close().catch(() => {})
      p.browser = null
    }
  }, IDLE_TIMEOUT_MS)
}

// 简单信号量：限制并发页面数
let semaphoreCount = 0
const semaphoreQueue: Array<() => void> = []

async function acquireSemaphore(): Promise<void> {
  if (semaphoreCount < MAX_CONCURRENT_PAGES) {
    semaphoreCount++
    return
  }
  return new Promise((resolve) => {
    semaphoreQueue.push(() => {
      semaphoreCount++
      resolve()
    })
  })
}

function releaseSemaphore(): void {
  semaphoreCount--
  const next = semaphoreQueue.shift()
  if (next) next()
}

/**
 * 使用浏览器池执行一个渲染任务
 * @param task 接收 Page 对象，执行渲染并返回结果的异步函数
 */
export async function withBrowserPage<T>(
  task: (page: import('puppeteer-core').Page) => Promise<T>
): Promise<T> {
  const pool = getPool()
  pool.activeTasks++
  resetIdleTimer()

  await acquireSemaphore()
  const browser = await launchBrowser()
  const page = await browser.newPage()

  try {
    return await task(page)
  } finally {
    await page.close().catch(() => {})
    releaseSemaphore()
    pool.activeTasks--
    resetIdleTimer()
  }
}
