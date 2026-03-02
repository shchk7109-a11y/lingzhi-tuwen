import { NextRequest, NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import path from "path"
import { withBrowserPage } from "@/lib/browser-pool"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const rl = checkRateLimit(`render-batch:${ip}`, { windowMs: 60_000, max: 10 })
  if (!rl.success) {
    return NextResponse.json({ error: "批量渲染请求过于频繁" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { items } = body as {
      items: Array<{ coverData: object; filename: string }>
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items 不能为空" }, { status: 400 })
    }
    if (items.length > 30) {
      return NextResponse.json({ error: "单次批量渲染最多 30 张" }, { status: 400 })
    }

    const coversDir = path.join("/tmp", "covers")
    await mkdir(coversDir, { recursive: true })

    const internalHost = "http://localhost:3000"

    const results = await Promise.allSettled(
      items.map(async ({ coverData, filename }) => {
        const safeFilename = (filename || `cover_${Date.now()}`)
          .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_")
          .substring(0, 60)
        const fullFilename = `${safeFilename}.png`
        const filePath = path.join(coversDir, fullFilename)

        const coverPageUrl = `${internalHost}/cover-render?data=${encodeURIComponent(
          JSON.stringify(coverData)
        )}`

        await withBrowserPage(async (page) => {
          await page.setViewport({ width: 375, height: 600, deviceScaleFactor: 2 })
          await page.goto(coverPageUrl, { waitUntil: "domcontentloaded", timeout: 30000 })
          // 等待 React hydration 完成并标记 data-ready
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

        return { filename: fullFilename, url: `/api/covers/${fullFilename}` }
      })
    )

    const output = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return { index: i, success: true, ...r.value }
      } else {
        return { index: i, success: false, error: r.reason?.message || "渲染失败" }
      }
    })

    return NextResponse.json({ results: output })
  } catch (error: any) {
    console.error("批量封面渲染失败:", error)
    return NextResponse.json({ error: error.message || "批量渲染失败" }, { status: 500 })
  }
}
