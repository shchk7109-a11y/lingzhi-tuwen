import { NextRequest, NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import path from "path"
import { withBrowserPage } from "@/lib/browser-pool"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
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

    // 使用 /tmp/covers/（Railway 容器中 /tmp 可写）
    const coversDir = path.join("/tmp", "covers")
    await mkdir(coversDir, { recursive: true })

    const safeFilename = (filename || `cover_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_")
      .substring(0, 60)
    const fullFilename = `${safeFilename}.png`
    const filePath = path.join(coversDir, fullFilename)

    // 使用 localhost:3000 内部访问（避免外网延迟）
    const internalHost = "http://localhost:3000"
    const coverPageUrl = `${internalHost}/cover-render?data=${encodeURIComponent(JSON.stringify(coverData))}`

    await withBrowserPage(async (page) => {
      // 设置视口：封面宽度 375px，高度给足空间让页面完整渲染
      await page.setViewport({ width: 375, height: 800, deviceScaleFactor: 2 })
      await page.goto(coverPageUrl, { waitUntil: "domcontentloaded", timeout: 30000 })

      // 等待 #cover-root 元素出现（不管有没有 data-ready）
      await page.waitForSelector("#cover-root", { timeout: 15000 })

      // 再等待一段时间让图片和字体渲染完成
      await new Promise((r) => setTimeout(r, 1500))

      // 通过 JS 获取 #cover-root 的精确位置和尺寸
      const rect = await page.evaluate(() => {
        const el = document.getElementById("cover-root")
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left, y: r.top, width: r.width, height: r.height }
      })

      if (rect && rect.width > 0 && rect.height > 0) {
        // 用坐标裁剪截图，精确截取封面区域
        await page.screenshot({
          path: filePath as `${string}.png`,
          clip: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        })
      } else {
        // 降级：截取固定区域（375x600，跳过顶部导航栏高度）
        await page.screenshot({
          path: filePath as `${string}.png`,
          clip: { x: 0, y: 0, width: 375, height: 600 },
        })
      }
    })

    const webUrl = `/api/covers/${fullFilename}`
    return NextResponse.json({ url: webUrl, filename: fullFilename })
  } catch (error: any) {
    console.error("封面图渲染失败:", error)
    return NextResponse.json({ error: error.message || "渲染失败" }, { status: 500 })
  }
}
