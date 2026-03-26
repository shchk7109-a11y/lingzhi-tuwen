// 发布习惯子表 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const habit = await prisma.publishHabit.findUnique({
      where: { customerId: params.id },
    })
    if (!habit) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json(habit)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch publish habit' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const habit = await prisma.publishHabit.upsert({
      where: { customerId: params.id },
      create: { customerId: params.id, ...body },
      update: body,
    })
    return NextResponse.json(habit)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update publish habit' }, { status: 500 })
  }
}
