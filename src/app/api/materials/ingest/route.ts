// 素材批量导入 API：接收 System A 推送的素材
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const materials = Array.isArray(body) ? body : body.materials

    if (!Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json({ error: '请提供素材数组' }, { status: 400 })
    }

    const results = await prisma.$transaction(
      materials.map((m: any) =>
        prisma.material.create({
          data: {
            filename: m.filename,
            filepath: m.filepath || '',
            webPath: m.webPath || '',
            productLine: m.productLine || '通用',
            productName: m.productName || '通用',
            sceneType: m.sceneType || '场景图',
            tags: m.tags,
            sourceType: m.sourceType || 'system_a_push',
            styleTags: m.styleTags,
            tierLevel: m.tierLevel ?? 1,
            colorTone: m.colorTone,
            season: m.season,
            category: m.category,
            expiresAt: m.expiresAt ? new Date(m.expiresAt) : null,
          },
        })
      )
    )

    return NextResponse.json({ imported: results.length, materials: results })
  } catch (error) {
    console.error('Materials ingest error:', error)
    return NextResponse.json({ error: 'Failed to ingest materials' }, { status: 500 })
  }
}
