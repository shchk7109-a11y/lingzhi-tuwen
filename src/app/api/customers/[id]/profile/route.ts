// 客户完整画像 API：查询和更新客户画像（含5张子表）
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        publishHabit: true,
        contentPreference: true,
        writingStyle: true,
        trendTracking: true,
        performanceMetric: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      publishHabit,
      contentPreference,
      writingStyle,
      trendTracking,
      performanceMetric,
      ...customerFields
    } = body

    const result = await prisma.$transaction(async (tx) => {
      // 更新客户主表字段
      if (Object.keys(customerFields).length > 0) {
        await tx.customer.update({
          where: { id: params.id },
          data: customerFields,
        })
      }

      // 更新子表（upsert）
      if (publishHabit) {
        await tx.publishHabit.upsert({
          where: { customerId: params.id },
          create: { customerId: params.id, ...publishHabit },
          update: publishHabit,
        })
      }
      if (contentPreference) {
        await tx.contentPreference.upsert({
          where: { customerId: params.id },
          create: { customerId: params.id, ...contentPreference },
          update: contentPreference,
        })
      }
      if (writingStyle) {
        await tx.writingStyle.upsert({
          where: { customerId: params.id },
          create: { customerId: params.id, ...writingStyle },
          update: writingStyle,
        })
      }
      if (trendTracking) {
        await tx.trendTracking.upsert({
          where: { customerId: params.id },
          create: { customerId: params.id, ...trendTracking },
          update: trendTracking,
        })
      }
      if (performanceMetric) {
        await tx.performanceMetric.upsert({
          where: { customerId: params.id },
          create: { customerId: params.id, ...performanceMetric },
          update: performanceMetric,
        })
      }

      // 返回完整画像
      return tx.customer.findUnique({
        where: { id: params.id },
        include: {
          publishHabit: true,
          contentPreference: true,
          writingStyle: true,
          trendTracking: true,
          performanceMetric: true,
        },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
