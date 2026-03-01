import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { withBrowserPage } from "@/lib/browser-pool"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * POST /api/covers/render-batch
 *
 * 批量并行渲染多张封面，利用浏览器池实现真正的并发渲染。
 * 相比逐个串行渲染，速度提升约 MAX_CONCURRENT_RENDERS 倍。
 *
 * 请求体：
 * {
 *   items: Array<{ coverData: object, filename: string }>,
 *   baseUrl?: string
 * }
 *
 * 注意：保存到 /tmp/covers/（Railway standalone 模式下 public 目录不可写）
 * 始终使用 localhost:3000 内部访问（避免外网延迟和 networkidle 超时）
 */
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
      baseUrl?: string
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items 不能为空" }, { status: 400 })
    }
    if (items.length > 30) {
      return NextResponse.json({ error: "单次批量渲染最多 30 张" }, { status: 400 })
    }

    // 使用 /tmp/covers/（Railway 容器中 /tmp 可写）
    const coversDir = path.join("/tmp", "covers")
    await mkdir(coversDir, { recursive: true })

    // 始终使用 localhost:3000 内部访问
    const internalHost = "http://localhost:3000"

    // 并行渲染所有封面（浏览器池内部通过信号量控制最大并发数）
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
          await page.goto(coverPageUrl, { waitUntil: "load", timeout: 60000 })
          await page.waitForSelector("#cover-root", { timeout: 15000 })
          await new Promise((r) => setTimeout(r, 800))

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
