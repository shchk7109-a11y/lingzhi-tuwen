import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// POST /api/covers/save
// 接收 base64 图片数据，保存到 /tmp/covers/，返回可访问的 URL
// 注意：Railway standalone 模式下 public 目录不可写，改用 /tmp + API 路由提供文件服务
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageData, filename } = body

    if (!imageData) {
      return NextResponse.json({ error: "缺少图片数据" }, { status: 400 })
    }

    // 解析 base64 数据
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // 确保 /tmp/covers 目录存在（/tmp 在 Railway 容器中可写）
    const coversDir = path.join("/tmp", "covers")
    await mkdir(coversDir, { recursive: true })

    // 生成文件名
    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_").substring(0, 50)
      : `cover_${Date.now()}`
    const fullFilename = `${safeFilename}.png`
    const filePath = path.join(coversDir, fullFilename)

    // 写入文件
    await writeFile(filePath, buffer)

    // 返回 API 路由 URL（而非静态文件 URL）
    const webUrl = `/api/covers/${fullFilename}`
    return NextResponse.json({ url: webUrl, filename: fullFilename })
  } catch (error: any) {
    console.error("封面图保存失败:", error)
    return NextResponse.json({ error: error.message || "保存失败" }, { status: 500 })
  }
}
