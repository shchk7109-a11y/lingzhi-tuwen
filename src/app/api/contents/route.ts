import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const search = searchParams.get('search')

    const where: any = {}
    if (platform && platform !== 'all') where.platform = platform
    if (search) {
      where.OR = [
        { cleanedText: { contains: search } },
        { originalText: { contains: search } },
      ]
    }

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, nickname: true, occupation: true, city: true, xhsAccount: true, wechatId: true, category: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.content.count({ where }),
    ])
    return NextResponse.json({ contents, total, page, pageSize })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId, originalText, cleanedText, coverData, coverUrl,
      title, subtitle, productName, productSlogan,
      image2Url, image3Url, image4Url, platform, status, tags, xhsAccount
    } = body

    if (!customerId || !originalText) {
      return NextResponse.json({ error: 'customerId and originalText are required' }, { status: 400 })
    }

    const content = await prisma.content.create({
      data: {
        customerId,
        originalText,
        cleanedText,
        coverData: coverData ? (typeof coverData === 'string' ? coverData : JSON.stringify(coverData)) : null,
        coverUrl: coverUrl || null,
        title,
        subtitle,
        productName,
        productSlogan,
        image2Url,
        image3Url,
        image4Url,
        platform: platform || 'xhs',
        status: status || 'done',
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
        xhsAccount: xhsAccount || null,
      },
    })
    return NextResponse.json(content)
  } catch (error) {
    console.error('Create content error:', error)
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, cleanedText, coverData, coverUrl, title, subtitle, image2Url, image3Url, image4Url } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updateData: any = {}
    if (cleanedText !== undefined) updateData.cleanedText = cleanedText
    if (coverData !== undefined) updateData.coverData = typeof coverData === 'string' ? coverData : JSON.stringify(coverData)
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (image2Url !== undefined) updateData.image2Url = image2Url
    if (image3Url !== undefined) updateData.image3Url = image3Url
    if (image4Url !== undefined) updateData.image4Url = image4Url

    const content = await prisma.content.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(content)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.content.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
  }
}
