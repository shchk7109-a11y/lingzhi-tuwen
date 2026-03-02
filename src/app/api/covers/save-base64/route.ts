import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { base64, filename } = await request.json()

    if (!base64 || !filename) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 })
    }

    // 确保目录存在
    const coversDir = "/tmp/covers"
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }

    // 解析 base64 数据（支持 data:image/png;base64,xxx 格式）
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // 保存文件
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_")
    const filePath = path.join(coversDir, safeFilename)
    fs.writeFileSync(filePath, buffer)

    // 返回公开 URL
    const baseUrl = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
      : `http://${request.headers.get("host")}`

    const publicUrl = `${baseUrl}/api/covers/${safeFilename}`

    return NextResponse.json({ url: publicUrl, filename: safeFilename })
  } catch (error: any) {
    console.error("save-base64 error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
