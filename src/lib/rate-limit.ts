/**
 * 简单的内存速率限制器
 * 适用于单实例部署场景（如本地/单服务器）
 * 生产多实例部署时应替换为 Redis 实现
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// 定期清理过期条目，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 60_000)

export interface RateLimitOptions {
  /** 时间窗口（毫秒），默认 60 秒 */
  windowMs?: number
  /** 时间窗口内最大请求次数，默认 20 */
  max?: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * 检查指定 key 是否超出速率限制
 * @param key 通常是 IP 地址或 IP+路由的组合
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 60_000, max = 20 } = options
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count += 1

  return {
    success: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  }
}
