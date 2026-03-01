/**
 * 后端批处理任务队列
 *
 * 核心改进：将批处理逻辑从前端移至服务端，
 * 实现真正的异步处理——页面关闭后任务仍可继续运行。
 *
 * 架构：
 * - 前端：提交任务 → 轮询进度 → 展示结果
 * - 后端：接收任务 → 入队 → Worker 异步消费
 */

import { v4 as uuidv4 } from 'uuid'

export type TaskStatus = 'pending' | 'running' | 'done' | 'error'
export type ItemStatus = 'pending' | 'cleaning' | 'cover' | 'matching' | 'done' | 'error'

export interface BatchItem {
  id: string
  text: string
  customerName?: string
  customerCategory?: string
  customerCity?: string
  platform: 'xhs' | 'moments'
  // 处理结果
  status: ItemStatus
  cleanedText?: string
  coverData?: object
  matchedImages?: string[]
  contentId?: string
  error?: string
}

export interface BatchTask {
  id: string
  status: TaskStatus
  platform: 'xhs' | 'moments'
  items: BatchItem[]
  createdAt: number
  startedAt?: number
  completedAt?: number
  progress: number // 0-100
  processingIndex: number
  processingStage?: string
  error?: string
}

// 使用 globalThis 确保 Next.js 热重载时不丢失状态
const g = globalThis as unknown as {
  __taskQueue?: Map<string, BatchTask>
  __taskWorkerRunning?: boolean
}

function getStore(): Map<string, BatchTask> {
  if (!g.__taskQueue) g.__taskQueue = new Map()
  return g.__taskQueue
}

/** 创建一个新的批处理任务 */
export function createBatchTask(
  items: Array<{ text: string; customerName?: string; customerCategory?: string; customerCity?: string }>,
  platform: 'xhs' | 'moments'
): BatchTask {
  const task: BatchTask = {
    id: uuidv4(),
    status: 'pending',
    platform,
    items: items.map((item) => ({
      id: uuidv4(),
      ...item,
      platform,
      status: 'pending',
    })),
    createdAt: Date.now(),
    progress: 0,
    processingIndex: -1,
  }
  getStore().set(task.id, task)
  return task
}

/** 获取任务状态（用于前端轮询） */
export function getTask(taskId: string): BatchTask | null {
  return getStore().get(taskId) || null
}

/** 获取任务的精简进度信息（减少轮询数据量） */
export function getTaskProgress(taskId: string): {
  status: TaskStatus
  progress: number
  processingIndex: number
  processingStage?: string
  itemStatuses: Array<{ id: string; status: ItemStatus; error?: string }>
} | null {
  const task = getStore().get(taskId)
  if (!task) return null
  return {
    status: task.status,
    progress: task.progress,
    processingIndex: task.processingIndex,
    processingStage: task.processingStage,
    itemStatuses: task.items.map((item) => ({
      id: item.id,
      status: item.status,
      error: item.error,
    })),
  }
}

/** 更新任务中某个 item 的状态 */
export function updateItemStatus(
  taskId: string,
  itemIndex: number,
  updates: Partial<BatchItem>
): void {
  const task = getStore().get(taskId)
  if (!task) return
  Object.assign(task.items[itemIndex], updates)
  // 重新计算进度
  const done = task.items.filter((i) => i.status === 'done' || i.status === 'error').length
  task.progress = Math.round((done / task.items.length) * 100)
}

/** 更新任务整体状态 */
export function updateTaskStatus(taskId: string, updates: Partial<BatchTask>): void {
  const task = getStore().get(taskId)
  if (!task) return
  Object.assign(task, updates)
}

/** 清理超过 24 小时的旧任务，防止内存泄漏 */
export function cleanupOldTasks(): void {
  const store = getStore()
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  store.forEach((task, id) => {
    if (task.createdAt < cutoff) store.delete(id)
  })
}

// 每小时自动清理一次
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldTasks, 60 * 60 * 1000)
}
