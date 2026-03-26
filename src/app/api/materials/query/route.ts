// 素材池查询 API：按条件筛选素材，自动过滤已达引用上限的素材
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const colorTone = searchParams.get('colorTone')
    const season = searchParams.get('season')
    const tierLevel = searchParams.get('tierLevel')
    const sceneType = searchParams.get('sceneType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      status: 'active',
    }

    if (category) where.category = category
    if (colorTone) where.colorTone = colorTone
    if (season) where.season = { in: [season, 'all'] }
    if (tierLevel) where.tierLevel = parseInt(tierLevel)
    if (sceneType) where.sceneType = sceneType

    // 过滤未过期素材
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ]

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // 过滤已达每日引用上限的素材（R3规则）
    const filtered = materials.filter((m) => m.dailyRefCount < m.maxDailyRef)

    return NextResponse.json({ materials: filtered, total: filtered.length })
  } catch (error) {
    console.error('Materials query error:', error)
    return NextResponse.json({ error: 'Failed to query materials' }, { status: 500 })
  }
}
