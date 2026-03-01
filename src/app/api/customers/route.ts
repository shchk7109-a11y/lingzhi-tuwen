import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = { status: 'active' }
    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nickname: { contains: search } },
        { occupation: { contains: search } },
        { city: { contains: search } },
        { xhsAccount: { contains: search } },
        { wechatId: { contains: search } },
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { contents: true } } },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({ customers, total, page, pageSize })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { name, nickname, gender, age, occupation, city, income, category, lifestyle, painPoints, needs, scenes, language, xhsAccount, wechatId } = body
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const customer = await prisma.customer.create({
      data: { name, nickname, gender, age: age ? parseInt(age) : null, occupation, city, income, category: category || '职场精英型', lifestyle, painPoints, needs, scenes, language, xhsAccount, wechatId },
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, name, nickname, gender, age, occupation, city, income, category, lifestyle, painPoints, needs, scenes, language, xhsAccount, wechatId, status } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, nickname, gender, age: age ? parseInt(age) : null, occupation, city, income, category, lifestyle, painPoints, needs, scenes, language, xhsAccount, wechatId, status },
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    // 软删除
    await prisma.customer.update({
      where: { id },
      data: { status: 'deleted' },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
