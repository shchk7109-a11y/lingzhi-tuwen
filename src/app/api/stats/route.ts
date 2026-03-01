import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stats
 * 返回系统运营统计数据，供 Dashboard 使用
 */
export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 并行查询所有统计数据
    const [
      totalContents,
      todayContents,
      last7DaysContents,
      last30DaysContents,
      totalCustomers,
      totalMaterials,
      platformStats,
      dailyTrend,
      materialsByLine,
    ] = await Promise.all([
      prisma.content.count(),
      prisma.content.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.content.count({ where: { createdAt: { gte: startOf7Days } } }),
      prisma.content.count({ where: { createdAt: { gte: startOf30Days } } }),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.material.count(),
      // 按平台统计
      prisma.content.groupBy({
        by: ['platform'],
        _count: { id: true },
      }),
      // 近14天每日生成趋势（使用原始 SQL）
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT
          date(createdAt) as date,
          COUNT(*) as count
        FROM Content
        WHERE createdAt >= ${new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()}
        GROUP BY date(createdAt)
        ORDER BY date ASC
      `,
      // 素材按产品线统计
      prisma.material.groupBy({
        by: ['productLine'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ])

    // 通过关联查询获取客户分类统计（近30天）
    const categoryStatsRaw = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
      SELECT c.category, COUNT(ct.id) as count
      FROM Content ct
      JOIN Customer c ON ct.customerId = c.id
      WHERE ct.createdAt >= ${startOf30Days.toISOString()}
      GROUP BY c.category
      ORDER BY count DESC
      LIMIT 8
    `

    // Top 10 活跃客户（近30天）
    const topCustomersRaw = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT c.name, COUNT(ct.id) as count
      FROM Content ct
      JOIN Customer c ON ct.customerId = c.id
      WHERE ct.createdAt >= ${startOf30Days.toISOString()}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `

    return NextResponse.json({
      overview: {
        totalContents,
        todayContents,
        last7DaysContents,
        last30DaysContents,
        totalCustomers,
        totalMaterials,
      },
      platformStats: platformStats.map((p) => ({
        platform: p.platform || '未知',
        count: p._count.id,
      })),
      categoryStats: categoryStatsRaw.map((c) => ({
        category: c.category || '未分类',
        count: Number(c.count),
      })),
      dailyTrend: dailyTrend.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      topCustomers: topCustomersRaw.map((c) => ({
        name: c.name || '未知',
        count: Number(c.count),
      })),
      materialsByLine: materialsByLine.map((m) => ({
        productLine: m.productLine || '未分类',
        count: m._count.id,
      })),
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: error.message || '获取统计数据失败' }, { status: 500 })
  }
}
