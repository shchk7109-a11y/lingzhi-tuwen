// 趋势追踪子表 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tracking = await prisma.trendTracking.findUnique({
      where: { customerId: params.id },
    })
    if (!tracking) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json(tracking)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trend tracking' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const tracking = await prisma.trendTracking.upsert({
      where: { customerId: params.id },
      create: { customerId: params.id, ...body },
      update: body,
    })
    return NextResponse.json(tracking)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trend tracking' }, { status: 500 })
  }
}
