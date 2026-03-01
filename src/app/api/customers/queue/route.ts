import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const QUEUE_KEY = 'customer_queue'

// 获取当前队列状态
export async function GET() {
  try {
    // 获取活跃客户总数
    const allCustomers = await prisma.customer.findMany({
      where: { status: 'active' },
      select: { id: true },
    })
    const allIds = allCustomers.map(c => c.id)
    const totalActive = allIds.length

    const setting = await prisma.setting.findUnique({ where: { key: QUEUE_KEY } })
    if (!setting || !setting.value) {
      return NextResponse.json({ queue: [], remaining: 0, total: totalActive })
    }
    const rawQueue: string[] = JSON.parse(setting.value)
    // 过滤掉已删除的客户
    const queue = rawQueue.filter(id => allIds.includes(id))
    return NextResponse.json({ queue, remaining: queue.length, total: totalActive })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get queue' }, { status: 500 })
  }
}

// 从队列中取 count 个客户ID，返回选中的ID列表和剩余队列
export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json()
    if (!count || count < 1) {
      return NextResponse.json({ error: 'count is required' }, { status: 400 })
    }

    // 获取所有活跃客户
    const allCustomers = await prisma.customer.findMany({
      where: { status: 'active' },
      select: { id: true },
    })
    const allIds = allCustomers.map(c => c.id)
    if (allIds.length === 0) {
      return NextResponse.json({ error: 'No customers available' }, { status: 404 })
    }

    // 读取当前队列
    const setting = await prisma.setting.findUnique({ where: { key: QUEUE_KEY } })
    let queue: string[] = []
    if (setting && setting.value) {
      try {
        const parsed: string[] = JSON.parse(setting.value)
        // 过滤掉已删除的客户ID
        queue = parsed.filter(id => allIds.includes(id))
      } catch { queue = [] }
    }

    // 选出 count 个客户ID
    const selected: string[] = []
    let workQueue = [...queue]

    for (let i = 0; i < count; i++) {
      if (workQueue.length === 0) {
        // 队列耗尽，重新打乱所有客户，开始新一轮
        const shuffled = [...allIds].sort(() => Math.random() - 0.5)
        workQueue = shuffled
      }
      const nextId = workQueue.shift()!
      selected.push(nextId)
    }

    // 持久化剩余队列
    await prisma.setting.upsert({
      where: { key: QUEUE_KEY },
      update: { value: JSON.stringify(workQueue) },
      create: { key: QUEUE_KEY, value: JSON.stringify(workQueue) },
    })

    return NextResponse.json({
      selectedIds: selected,
      remaining: workQueue.length,
      total: allIds.length,
    })
  } catch (error) {
    console.error('Queue error:', error)
    return NextResponse.json({ error: 'Failed to process queue' }, { status: 500 })
  }
}

// 重置队列（清空，下次分配时重新打乱）
export async function DELETE() {
  try {
    await prisma.setting.upsert({
      where: { key: QUEUE_KEY },
      update: { value: '[]' },
      create: { key: QUEUE_KEY, value: '[]' },
    })
    return NextResponse.json({ success: true, message: '队列已重置' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset queue' }, { status: 500 })
  }
}
