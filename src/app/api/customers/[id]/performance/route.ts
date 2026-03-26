// 表现指标子表 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const metric = await prisma.performanceMetric.findUnique({
      where: { customerId: params.id },
    })
    if (!metric) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json(metric)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch performance metric' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const metric = await prisma.performanceMetric.upsert({
      where: { customerId: params.id },
      create: { customerId: params.id, ...body },
      update: body,
    })
    return NextResponse.json(metric)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update performance metric' }, { status: 500 })
  }
}
