/**
 * POST /api/materials-lib/auto-tag
 *
 * 接收 base64 图片数据，调用 Gemini 多模态分析，返回结构化标签。
 * Body: { images: Array<{ fileName: string, base64: string, mimeType: string }> }
 * Response: { results: Array<{ fileName: string, tags: AutoTagResult }> }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { analyzeImageBatch, type AutoTagResult } from '@/lib/ai-image/auto-tagger'
import { prisma } from '@/lib/prisma'

// Gemini 中转端点配置
const GEMINI_BASE_URL = 'https://api.gdoubolai.com/v1'
const GEMINI_MODEL = 'gemini-3-flash-preview'

async function getGeminiApiKey(): Promise<string | null> {
  // 优先从环境变量读取
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY

  // 否则从 Settings 表读取（当前模型如果是 gemini，共用同一个 key）
  const setting = await prisma.setting.findUnique({ where: { key: 'api_key' } })
  return setting?.value || null
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { images } = body as {
      images: Array<{ fileName: string; base64: string; mimeType: string }>
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '请提供至少一张图片' }, { status: 400 })
    }

    if (images.length > 20) {
      return NextResponse.json({ error: '单次最多分析 20 张图片' }, { status: 400 })
    }

    const apiKey = await getGeminiApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key 未配置，请在设置页面或环境变量 GEMINI_API_KEY 中配置' },
        { status: 500 }
      )
    }

    const aiConfig = {
      baseUrl: GEMINI_BASE_URL,
      apiKey,
      modelName: GEMINI_MODEL,
    }

    const results = await analyzeImageBatch(images, aiConfig)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Auto-tag error:', error)
    return NextResponse.json(
      { error: `AI 标签分析失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
