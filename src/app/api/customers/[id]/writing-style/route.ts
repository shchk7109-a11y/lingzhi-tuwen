// 写作风格子表 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const style = await prisma.writingStyle.findUnique({
      where: { customerId: params.id },
    })
    if (!style) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json(style)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch writing style' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const style = await prisma.writingStyle.upsert({
      where: { customerId: params.id },
      create: { customerId: params.id, ...body },
      update: body,
    })
    return NextResponse.json(style)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update writing style' }, { status: 500 })
  }
}
