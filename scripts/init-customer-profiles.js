// 为现有客户初始化画像子表数据（纯 JS 版本，用于生产环境）
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const customers = await prisma.customer.findMany({ select: { id: true, name: true } })
  console.log(`找到 ${customers.length} 个客户，开始检查画像子表...`)

  let initialized = 0

  for (const customer of customers) {
    const [habit, pref, style, trend, perf] = await Promise.all([
      prisma.publishHabit.findUnique({ where: { customerId: customer.id } }),
      prisma.contentPreference.findUnique({ where: { customerId: customer.id } }),
      prisma.writingStyle.findUnique({ where: { customerId: customer.id } }),
      prisma.trendTracking.findUnique({ where: { customerId: customer.id } }),
      prisma.performanceMetric.findUnique({ where: { customerId: customer.id } }),
    ])

    const creates = []
    if (!habit) creates.push(prisma.publishHabit.create({ data: { customerId: customer.id } }))
    if (!pref) creates.push(prisma.contentPreference.create({ data: { customerId: customer.id } }))
    if (!style) creates.push(prisma.writingStyle.create({ data: { customerId: customer.id } }))
    if (!trend) creates.push(prisma.trendTracking.create({ data: { customerId: customer.id } }))
    if (!perf) creates.push(prisma.performanceMetric.create({ data: { customerId: customer.id } }))

    if (creates.length > 0) {
      await Promise.all(creates)
      initialized++
      console.log(`  ✓ ${customer.name} (${customer.id}): 初始化了 ${creates.length} 张子表`)
    }
  }

  console.log(`\n完成！已为 ${initialized} 个客户初始化画像数据`)
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
