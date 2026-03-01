import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// GET /api/covers/[filename]
// 从 /tmp/covers/ 读取封面图并返回（解决 Railway standalone 模式下 public 目录不可写问题）
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // 安全检查：只允许 .png 文件，防止路径穿越
    if (!filename || !/^[\w\u4e00-\u9fa5_\-\.]+\.png$/i.test(filename)) {
      return NextResponse.json({ error: "无效的文件名" }, { status: 400 })
    }

    const filePath = path.join("/tmp", "covers", filename)
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "封面图不存在" }, { status: 404 })
    }
    console.error("封面图读取失败:", error)
    return NextResponse.json({ error: error.message || "读取失败" }, { status: 500 })
  }
}
