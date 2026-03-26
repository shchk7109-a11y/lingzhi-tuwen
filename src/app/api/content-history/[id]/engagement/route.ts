// 内容互动数据更新 API（发布系统回调用）
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { engagement, status, publishedAt } = body

    const updateData: any = {}
    if (engagement !== undefined) updateData.engagement = engagement
    if (status !== undefined) updateData.status = status
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt)

    const record = await prisma.contentHistory.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Engagement PUT error:', error)
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 })
  }
}
