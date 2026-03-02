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
      await page.setViewport({ width: 375, height: 600, deviceScaleFactor: 2 })
      // 等待 DOM 加载完成（不等 networkidle，避免超时）
      await page.goto(coverPageUrl, { waitUntil: "domcontentloaded", timeout: 30000 })
      // 等待 cover-render 页面的 React hydration 完成并标记 data-ready
      // data-ready 是在所有图片加载完成后才设置的，确保截图时内容完整
      await page.waitForSelector("#cover-root[data-ready='true']", { timeout: 20000 })

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

    const webUrl = `/api/covers/${fullFilename}`
    return NextResponse.json({ url: webUrl, filename: fullFilename })
  } catch (error: any) {
    console.error("封面图渲染失败:", error)
    return NextResponse.json({ error: error.message || "渲染失败" }, { status: 500 })
  }
}
