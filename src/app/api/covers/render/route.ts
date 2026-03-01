import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { withBrowserPage } from "@/lib/browser-pool"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * POST /api/covers/render
 *
 * 优化点：
 * 1. 使用浏览器实例复用池（不再每次 launch/close 完整浏览器）
 * 2. 内部使用 localhost:3000 访问（避免外网延迟和 networkidle 超时）
 * 3. 添加速率限制，防止并发滥用
 * 4. 保存到 /tmp/covers/（Railway standalone 模式下 public 目录不可写）
 */
export async function POST(req: NextRequest) {
  // 速率限制：每分钟最多 60 次渲染请求
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const rl = checkRateLimit(`render:${ip}`, { windowMs: 60_000, max: 60 })
  if (!rl.success) {
    return NextResponse.json({ error: "渲染请求过于频繁，请稍后再试" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { coverData, filename } = body

    if (!coverData) {
      return NextResponse.json({ error: "缺少封面数据" }, { status: 400 })
    }

    // 确保 /tmp/covers 目录存在（/tmp 在 Railway 容器中可写）
    const coversDir = path.join("/tmp", "covers")
    await mkdir(coversDir, { recursive: true })

    const safeFilename = (filename || `cover_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_")
      .substring(0, 60)
    const fullFilename = `${safeFilename}.png`
    const filePath = path.join(coversDir, fullFilename)

    // 始终使用 localhost:3000 内部访问（避免外网延迟和 networkidle 超时）
    const internalHost = "http://localhost:3000"
    const coverPageUrl = `${internalHost}/cover-render?data=${encodeURIComponent(JSON.stringify(coverData))}`

    // 使用浏览器池（复用已有浏览器实例，只创建新 Page）
    await withBrowserPage(async (page) => {
      await page.setViewport({ width: 375, height: 600, deviceScaleFactor: 2 })
      // 使用 load 而非 networkidle0，避免等待外部资源导致超时
      await page.goto(coverPageUrl, { waitUntil: "load", timeout: 60000 })
      // 等待封面组件渲染完成（React hydration 需要时间）
      await page.waitForSelector("#cover-root", { timeout: 15000 })
      // 额外等待字体/图片加载
      await new Promise((r) => setTimeout(r, 800))

      // 截取封面区域
      const element = await page.$("#cover-root")
      if (element) {
        await element.screenshot({ path: filePath as `${string}.png` })
      } else {
        await page.screenshot({
          path: filePath as `${string}.png`,
          clip: { x: 0, y: 0, width: 375, height: 600 },
        })
      }
    })

    // 返回 API 路由 URL（而非静态文件 URL）
    const webUrl = `/api/covers/${fullFilename}`
    return NextResponse.json({ url: webUrl, filename: fullFilename })
  } catch (error: any) {
    console.error("封面图渲染失败:", error)
    return NextResponse.json({ error: error.message || "渲染失败" }, { status: 500 })
  }
}
