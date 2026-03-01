/**
 * 历史批次持久化存储工具
 * - 使用 localStorage，key: "batch_history"
 * - 每条记录保留 2 天（TTL = 48小时），超期自动清理
 * - 单条记录最大 2MB（防止 localStorage 超限）
 */

const STORAGE_KEY = "batch_history"
const TTL_MS = 2 * 24 * 60 * 60 * 1000 // 2天
const MAX_RECORD_SIZE = 2 * 1024 * 1024  // 2MB per record

export interface BatchHistoryRecord {
  batchId: string
  batchNo: number
  totalBatches: number
  savedAt: number      // timestamp ms
  expireAt: number     // timestamp ms
  doneCount: number
  totalCount: number
  platform: 'xhs' | 'pyq'  // 平台类型
  items: BatchHistoryItem[]
}

export interface BatchHistoryItem {
  customerName?: string
  customerXhsAccount?: string
  customerWechatAccount?: string  // 朋友圈微信号
  customerCategory?: string
  customerCity?: string
  cleanedText?: string
  coverUrl?: string
  image2Url?: string
  image3Url?: string
  image4Url?: string
  coverTitle?: string
  tags?: string[]
  status: string
}

/**
 * 读取所有历史批次（自动过滤过期记录）
 */
export function loadBatchHistory(): BatchHistoryRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all: BatchHistoryRecord[] = JSON.parse(raw)
    const now = Date.now()
    // 过滤过期记录 + 过滤无 platform 字段的旧记录
    const valid = all.filter(r => r.expireAt > now && r.platform)
    // 如果有过期记录被清理，写回
    if (valid.length !== all.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    }
    return valid.sort((a, b) => b.savedAt - a.savedAt) // 最新的在前
  } catch {
    return []
  }
}

/**
 * 保存一批次到历史记录
 */
export function saveBatchToHistory(record: Omit<BatchHistoryRecord, "savedAt" | "expireAt">): boolean {
  if (typeof window === "undefined") return false
  try {
    const now = Date.now()
    const newRecord: BatchHistoryRecord = {
      ...record,
      savedAt: now,
      expireAt: now + TTL_MS,
    }

    // 检查单条记录大小
    const recordStr = JSON.stringify(newRecord)
    if (recordStr.length > MAX_RECORD_SIZE) {
      // 超过2MB，截断items中的cleanedText
      newRecord.items = newRecord.items.map(item => ({
        ...item,
        cleanedText: item.cleanedText ? item.cleanedText.slice(0, 500) + "…（已截断）" : item.cleanedText,
      }))
    }

    const existing = loadBatchHistory()
    // 如果已存在相同batchId，替换
    const filtered = existing.filter(r => r.batchId !== record.batchId)
    const updated = [newRecord, ...filtered]

    // 防止localStorage超限：如果总大小超过4MB，删除最旧的记录
    let serialized = JSON.stringify(updated)
    let trimmed = [...updated]
    while (serialized.length > 4 * 1024 * 1024 && trimmed.length > 1) {
      trimmed.pop()
      serialized = JSON.stringify(trimmed)
    }

    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * 删除指定批次
 */
export function deleteBatchFromHistory(batchId: string): void {
  if (typeof window === "undefined") return
  try {
    const existing = loadBatchHistory()
    const updated = existing.filter(r => r.batchId !== batchId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

/**
 * 格式化保存时间
 */
export function formatSavedAt(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - ts
  const diffH = Math.floor(diffMs / 3600000)
  const diffM = Math.floor(diffMs / 60000)

  if (diffM < 1) return "刚刚"
  if (diffM < 60) return `${diffM}分钟前`
  if (diffH < 24) return `${diffH}小时前`
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${hh}:${mm}`
}

/**
 * 计算距离过期的剩余时间描述
 */
export function formatExpireIn(expireAt: number): string {
  const diffMs = expireAt - Date.now()
  if (diffMs <= 0) return "已过期"
  const diffH = Math.floor(diffMs / 3600000)
  if (diffH < 1) return "不足1小时后过期"
  if (diffH < 24) return `${diffH}小时后过期`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}天后过期`
}
