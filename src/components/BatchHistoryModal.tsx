"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Trash2, Clock, CheckCircle2, ChevronDown, ChevronUp, History, Square, CheckSquare, Layers, Smartphone, MessageCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import {
  BatchHistoryRecord,
  loadBatchHistory,
  deleteBatchFromHistory,
  formatSavedAt,
  formatExpireIn,
} from "@/lib/batchHistory"

interface BatchHistoryModalProps {
  open: boolean
  onClose: () => void
}

// 小红书导出列
function buildXhsExportData(records: BatchHistoryRecord[]) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const rows: any[] = []
  let seq = 1
  for (const record of records) {
    for (const item of record.items.filter(i => i.status === "done")) {
      rows.push({
        序号: seq++,
        批次号: record.batchId,
        客户姓名: item.customerName || "-",
        小红书账号: item.customerXhsAccount || "-",
        客户分类: item.customerCategory || "-",
        封面主标题: item.coverTitle || "-",
        "去AI化文案": item.cleanedText || "-",
        话题标签: item.tags?.map((t: string) => `#${t}`).join(" ") || "-",
        封面图URL: item.coverUrl ? `${baseUrl}${item.coverUrl}` : "-",
        第2张配图URL: item.image2Url ? `${baseUrl}${item.image2Url}` : "-",
        第3张配图URL: item.image3Url ? `${baseUrl}${item.image3Url}` : "-",
      })
    }
  }
  return rows
}

// 朋友圈导出列
function buildPyqExportData(records: BatchHistoryRecord[]) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const rows: any[] = []
  let seq = 1
  for (const record of records) {
    for (const item of record.items.filter(i => i.status === "done")) {
      rows.push({
        序号: seq++,
        批次号: record.batchId,
        客户姓名: item.customerName || "-",
        客户分类: item.customerCategory || "-",
        微信号: item.customerWechatAccount || "-",
        文案: item.cleanedText || "-",
        配图1URL: item.image2Url ? `${baseUrl}${item.image2Url}` : "-",
        配图2URL: item.image3Url ? `${baseUrl}${item.image3Url}` : "-",
        配图3URL: item.image4Url ? `${baseUrl}${item.image4Url}` : "-",
      })
    }
  }
  return rows
}

function exportRecords(records: BatchHistoryRecord[], filename: string) {
  const platform = records[0]?.platform || 'xhs'
  const data = platform === 'xhs' ? buildXhsExportData(records) : buildPyqExportData(records)
  if (data.length === 0) {
    toast.error("所选批次没有已完成的条目")
    return
  }
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, platform === 'xhs' ? "小红书分发内容" : "朋友圈分发内容")
  XLSX.writeFile(wb, filename)
  toast.success(`已导出：${filename}（共 ${data.length} 条）`)
}

export default function BatchHistoryModal({ open, onClose }: BatchHistoryModalProps) {
  const [records, setRecords] = useState<BatchHistoryRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setRecords(loadBatchHistory())
      setSelectedIds(new Set())
    }
  }, [open])

  const handleDelete = (batchId: string) => {
    deleteBatchFromHistory(batchId)
    setRecords(prev => prev.filter(r => r.batchId !== batchId))
    setSelectedIds(prev => { const s = new Set(prev); s.delete(batchId); return s })
    toast.success("已删除该批次记录")
  }

  const toggleSelect = (batchId: string) => {
    const record = records.find(r => r.batchId === batchId)
    if (!record) return
    // 检查是否与已选批次平台一致
    if (selectedIds.size > 0) {
      const existingPlatform = records.find(r => selectedIds.has(r.batchId))?.platform
      if (existingPlatform && existingPlatform !== record.platform && !selectedIds.has(batchId)) {
        toast.error(`不能混合导出：已选批次为${existingPlatform === 'xhs' ? '小红书' : '朋友圈'}，请勿混选不同平台`)
        return
      }
    }
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (s.has(batchId)) s.delete(batchId)
      else s.add(batchId)
      return s
    })
  }

  const handleExport = (record: BatchHistoryRecord) => {
    const now = new Date().toLocaleDateString("zh-CN").replace(/\//g, "")
    exportRecords([record], `${record.batchId}_${record.platform === 'xhs' ? '小红书' : '朋友圈'}_分发内容.xlsx`)
  }

  const handleMergeExport = () => {
    if (selectedIds.size === 0) {
      toast.error("请先勾选要合并导出的批次")
      return
    }
    const targetRecords = records.filter(r => selectedIds.has(r.batchId))
    // 二次校验平台一致性
    const platforms = new Set(targetRecords.map(r => r.platform || 'xhs'))
    if (platforms.size > 1) {
      toast.error("不能混合导出小红书和朋友圈批次，请只选同一平台的批次")
      return
    }
    const platform = Array.from(platforms)[0]
    const now = new Date().toLocaleDateString("zh-CN").replace(/\//g, "")
    exportRecords(
      targetRecords,
      `合并导出_${platform === 'xhs' ? '小红书' : '朋友圈'}_${selectedIds.size}批次_${now}.xlsx`
    )
  }

  // 按平台分组
  const xhsRecords = records.filter(r => (r.platform || 'xhs') === 'xhs')
  const pyqRecords = records.filter(r => r.platform === 'pyq')

  const selectedPlatform = selectedIds.size > 0
    ? (records.find(r => selectedIds.has(r.batchId))?.platform || 'xhs')
    : null

  if (!open) return null

  const renderRecord = (record: BatchHistoryRecord) => {
    const isSelected = selectedIds.has(record.batchId)
    const isDisabled = selectedIds.size > 0 && !isSelected && selectedPlatform !== record.platform
    return (
      <div
        key={record.batchId}
        className={`border rounded-xl overflow-hidden transition-colors ${
          isSelected ? 'border-[#1E4D2B] bg-[#F0F7F2]' : isDisabled ? 'border-gray-100 opacity-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[#F9F6F0]">
          {/* 勾选框 */}
          <button
            onClick={() => toggleSelect(record.batchId)}
            className={`mr-2 shrink-0 transition-colors ${isDisabled ? 'cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-[#1E4D2B]'}`}
            disabled={isDisabled}
            title={isDisabled ? `已选${selectedPlatform === 'xhs' ? '小红书' : '朋友圈'}批次，不能混选` : ''}
          >
            {isSelected
              ? <CheckSquare className="w-4 h-4 text-[#1E4D2B]" />
              : <Square className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-[#1E4D2B]">{record.batchId}</span>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                第 {record.batchNo}/{record.totalBatches} 批
              </span>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                {record.doneCount}/{record.totalCount} 条完成
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatSavedAt(record.savedAt)}保存
              </span>
              <span className="text-xs text-amber-500">{formatExpireIn(record.expireAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <Button
              size="sm"
              onClick={() => handleExport(record)}
              className="bg-[#1E4D2B] hover:bg-[#2D6B3E] text-white h-8 px-3 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              导出
            </Button>
            <button
              onClick={() => setExpandedId(expandedId === record.batchId ? null : record.batchId)}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
              title="展开查看详情"
            >
              {expandedId === record.batchId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDelete(record.batchId)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
              title="删除该批次记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {expandedId === record.batchId && (
          <div className="divide-y divide-gray-100">
            {record.items.map((item, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-start gap-3">
                <span className="text-xs text-gray-400 w-5 shrink-0 mt-0.5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{item.customerName || "未知客户"}</span>
                    {item.customerCategory && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.customerCategory}</span>
                    )}
                    {item.status === "done"
                      ? <span className="text-xs text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />完成</span>
                      : <span className="text-xs text-red-400">失败</span>}
                  </div>
                  {item.coverTitle && <p className="text-xs text-[#1E4D2B] mt-0.5 truncate">封面：{item.coverTitle}</p>}
                  {item.cleanedText && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.cleanedText}</p>}
                </div>
                {item.coverUrl && (
                  <a href={item.coverUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-500 hover:underline">封面图</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#1E4D2B]" />
            <h2 className="text-lg font-bold text-[#1E4D2B]">历史批次记录</h2>
            <span className="text-xs text-gray-400 ml-1">（保留2天，可随时导出）</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 合并导出工具栏 */}
        {records.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs text-gray-500">
              {selectedIds.size > 0
                ? `已选 ${selectedIds.size} 个${selectedPlatform === 'xhs' ? '小红书' : '朋友圈'}批次`
                : '勾选同平台批次可合并导出'}
            </span>
            <Button
              size="sm"
              onClick={handleMergeExport}
              disabled={selectedIds.size === 0}
              className="bg-[#1E4D2B] hover:bg-[#2D6B3E] text-white h-7 px-3 text-xs disabled:opacity-40"
            >
              <Layers className="w-3 h-3 mr-1" />
              合并导出
            </Button>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {records.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无历史批次记录</p>
              <p className="text-xs mt-1">每次批次处理完成后会自动保存到这里</p>
            </div>
          ) : (
            <>
              {/* 小红书分组 */}
              {xhsRecords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">小红书</span>
                    <span className="text-xs text-gray-400">({xhsRecords.length} 批)</span>
                  </div>
                  <div className="space-y-2">
                    {xhsRecords.map(renderRecord)}
                  </div>
                </div>
              )}
              {/* 朋友圈分组 */}
              {pyqRecords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">朋友圈</span>
                    <span className="text-xs text-gray-400">({pyqRecords.length} 批)</span>
                  </div>
                  <div className="space-y-2">
                    {pyqRecords.map(renderRecord)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部说明 */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            历史记录保存在浏览器本地，超过2天自动清理 · 小红书与朋友圈批次不可混合导出
          </p>
        </div>
      </div>
    </div>
  )
}
