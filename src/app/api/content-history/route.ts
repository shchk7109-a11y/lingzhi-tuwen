// 内容历史 API：按客户和时间范围查询，创建记录
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const platform = searchParams.get('platform')
    const contentType = searchParams.get('contentType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (platform) where.platform = platform
    if (contentType) where.contentType = contentType
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [records, total] = await Promise.all([
      prisma.contentHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contentHistory.count({ where }),
    ])

    return NextResponse.json({ records, total, page, pageSize })
  } catch (error) {
    console.error('ContentHistory GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch content history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, platform, contentType } = body

    if (!customerId || !platform || !contentType) {
      return NextResponse.json(
        { error: 'customerId, platform, contentType 为必填字段' },
        { status: 400 }
      )
    }

    const record = await prisma.contentHistory.create({ data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('ContentHistory POST error:', error)
    return NextResponse.json({ error: 'Failed to create content history' }, { status: 500 })
  }
}
