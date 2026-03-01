/**
 * 批处理 Worker
 *
 * 将原来分散在前端 page.tsx 中的批处理逻辑集中到服务端，
 * 实现真正的后台异步处理。
 */

import {
  getTask,
  updateItemStatus,
  updateTaskStatus,
  type BatchTask,
} from './task-queue'

const g = globalThis as unknown as { __workerRunning?: boolean }

/** 调用内部 API（服务端内部调用，复用已有的 AI 处理逻辑） */
async function callInternalApi(path: string, body: object): Promise<any> {
  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${path} 失败: ${err}`)
  }
  return res.json()
}

/** 处理单个 Item */
async function processItem(task: BatchTask, index: number): Promise<void> {
  const item = task.items[index]

  try {
    // Step 1: 清洗文案
    updateItemStatus(task.id, index, { status: 'cleaning' })
    updateTaskStatus(task.id, { processingIndex: index, processingStage: '清洗文案' })

    const cleanResult = await callInternalApi('/api/ai/clean', {
      text: item.text,
      customerName: item.customerName,
      customerCategory: item.customerCategory,
      customerCity: item.customerCity,
      platform: item.platform,
    })
    updateItemStatus(task.id, index, { cleanedText: cleanResult.cleanedText })

    // Step 2: 生成封面信息（仅小红书）
    if (item.platform === 'xhs') {
      updateItemStatus(task.id, index, { status: 'cover' })
      updateTaskStatus(task.id, { processingStage: '生成封面' })

      try {
        const coverResult = await callInternalApi('/api/ai/cover', {
          text: cleanResult.cleanedText || item.text,
          customerName: item.customerName,
          customerCategory: item.customerCategory,
        })
        updateItemStatus(task.id, index, { coverData: coverResult.coverData })
      } catch (coverErr) {
        console.warn(`[Worker] 封面生成失败 (item ${index}):`, coverErr)
        // 封面生成失败不阻断流程
      }
    }

    // Step 3: 匹配素材
    updateItemStatus(task.id, index, { status: 'matching' })
    updateTaskStatus(task.id, { processingStage: '匹配素材' })

    try {
      const matchResult = await callInternalApi('/api/materials/match', {
        text: cleanResult.cleanedText || item.text,
        platform: item.platform,
        customerCategory: item.customerCategory,
      })
      updateItemStatus(task.id, index, { matchedImages: matchResult.images || [] })
    } catch (matchErr) {
      console.warn(`[Worker] 素材匹配失败 (item ${index}):`, matchErr)
    }

    // Step 4: 保存到数据库
    try {
      const saveResult = await callInternalApi('/api/contents', {
        customerName: item.customerName,
        platform: item.platform,
        originalText: item.text,
        cleanedText: cleanResult.cleanedText,
        coverData: item.platform === 'xhs' ? getTask(task.id)?.items[index]?.coverData : undefined,
        matchedImages: getTask(task.id)?.items[index]?.matchedImages,
      })
      updateItemStatus(task.id, index, { contentId: saveResult.id })
    } catch (saveErr) {
      console.warn(`[Worker] 保存内容失败 (item ${index}):`, saveErr)
    }

    updateItemStatus(task.id, index, { status: 'done' })
  } catch (err: any) {
    console.error(`[Worker] Item ${index} 处理失败:`, err)
    updateItemStatus(task.id, index, {
      status: 'error',
      error: err.message || '处理失败',
    })
  }
}

/** 运行批处理任务（异步，不阻塞 API 响应） */
async function runTask(taskId: string): Promise<void> {
  const task = getTask(taskId)
  if (!task) return

  updateTaskStatus(taskId, { status: 'running', startedAt: Date.now() })

  try {
    for (let i = 0; i < task.items.length; i++) {
      // 重新获取最新 task 状态（防止外部取消）
      const current = getTask(taskId)
      if (!current || current.status !== 'running') break

      await processItem(current, i)
    }

    const finalTask = getTask(taskId)
    if (finalTask) {
      const hasError = finalTask.items.some((item) => item.status === 'error')
      updateTaskStatus(taskId, {
        status: 'done',
        completedAt: Date.now(),
        progress: 100,
        processingStage: hasError ? '完成（部分失败）' : '全部完成',
      })
    }
  } catch (err: any) {
    console.error(`[Worker] Task ${taskId} 运行失败:`, err)
    updateTaskStatus(taskId, {
      status: 'error',
      error: err.message || '任务执行失败',
      completedAt: Date.now(),
    })
  }
}

/** 启动 Worker 处理指定任务（非阻塞） */
export function startWorker(taskId: string): void {
  // 使用 setImmediate 确保不阻塞当前 API 响应
  setImmediate(() => {
    runTask(taskId).catch((err) => {
      console.error('[Worker] Uncaught error:', err)
    })
  })
}
