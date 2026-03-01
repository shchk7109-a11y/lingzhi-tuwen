import { NextRequest, NextResponse } from 'next/server'
import { getTaskProgress } from '@/lib/task-queue'

/**
 * GET /api/batch/progress?taskId=xxx
 * 轻量级进度查询接口，供前端高频轮询使用（每 2 秒一次）
 * 只返回进度信息，不返回完整的 item 数据，减少网络传输
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'taskId 是必填参数' }, { status: 400 })
  }

  const progress = getTaskProgress(taskId)
  if (!progress) {
    return NextResponse.json({ error: '任务不存在或已过期' }, { status: 404 })
  }

  return NextResponse.json(progress, {
    headers: {
      // 禁止缓存，确保每次获取最新状态
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
