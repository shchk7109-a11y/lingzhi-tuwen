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
 * 2. 服务器 URL 从环境变量读取，不再硬编码
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
    const { coverData, filename, baseUrl } = body

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

    // 从环境变量读取服务器 URL，不再硬编码 localhost:3001
    const host =
      baseUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000"

    const coverPageUrl = `${host}/cover-render?data=${encodeURIComponent(JSON.stringify(coverData))}`

    // 使用浏览器池（复用已有浏览器实例，只创建新 Page）
    await withBrowserPage(async (page) => {
      await page.setViewport({ width: 375, height: 600, deviceScaleFactor: 2 })
      await page.goto(coverPageUrl, { waitUntil: "networkidle0", timeout: 30000 })
      // 等待封面组件渲染完成
      await page.waitForSelector("#cover-root", { timeout: 10000 })
      // 额外等待字体/图片加载
      await new Promise((r) => setTimeout(r, 300))

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
