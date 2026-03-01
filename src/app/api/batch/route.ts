import { NextRequest, NextResponse } from 'next/server'
import { createBatchTask, getTask } from '@/lib/task-queue'
import { startWorker } from '@/lib/batch-worker'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/batch
 * 提交批处理任务，立即返回 taskId，后台异步执行
 *
 * 请求体：
 * {
 *   items: Array<{ text, customerName?, customerCategory?, customerCity? }>,
 *   platform: 'xhs' | 'moments'
 * }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`batch:${ip}`, { windowMs: 60_000, max: 5 })
  if (!rl.success) {
    return NextResponse.json({ error: '提交过于频繁，请稍后再试' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { items, platform } = body as {
      items: Array<{ text: string; customerName?: string; customerCategory?: string; customerCity?: string }>
      platform: 'xhs' | 'moments'
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items 不能为空' }, { status: 400 })
    }
    if (items.length > 100) {
      return NextResponse.json({ error: '单次批量处理最多 100 条' }, { status: 400 })
    }
    if (!['xhs', 'moments'].includes(platform)) {
      return NextResponse.json({ error: 'platform 必须为 xhs 或 moments' }, { status: 400 })
    }

    // 创建任务并立即返回 taskId
    const task = createBatchTask(items, platform)

    // 在后台启动 Worker（非阻塞）
    startWorker(task.id)

    return NextResponse.json({
      taskId: task.id,
      total: task.items.length,
      message: '任务已提交，正在后台处理',
    })
  } catch (error: any) {
    console.error('Batch submit error:', error)
    return NextResponse.json({ error: error.message || '提交失败' }, { status: 500 })
  }
}

/**
 * GET /api/batch?taskId=xxx
 * 查询任务完整状态（包含所有 item 结果）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'taskId 是必填参数' }, { status: 400 })
  }

  const task = getTask(taskId)
  if (!task) {
    return NextResponse.json({ error: '任务不存在或已过期' }, { status: 404 })
  }

  return NextResponse.json(task)
}
