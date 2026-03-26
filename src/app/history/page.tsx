"use client"
import React, { useState, useEffect, useCallback } from "react"
import XhsCoverCardV3, { CoverDataV3 } from "@/components/XhsCoverCardV3"
import * as XLSX from "xlsx"
import { Smartphone, MessageCircle, LayoutGrid, Trash2, Download, RefreshCw, CheckSquare, Square, Search, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import ContentEditModal from "@/components/ContentEditModal"

interface ContentRecord {
  id: string
  customerId: string
  customer: {
    name: string
    nickname?: string
    occupation?: string
    city?: string
    xhsAccount?: string
    wechatId?: string
    category?: string
  }
  originalText: string
  cleanedText?: string
  coverData?: string
  title?: string
  subtitle?: string
  image2Url?: string
  image3Url?: string
  image4Url?: string
  coverUrl?: string
  platform: string
  status: string
  createdAt: string
}

export default function HistoryPage() {
  const { isAdmin, authHeaders } = useAuth()
  const [records, setRecords] = useState<ContentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<ContentRecord | null>(null)
  const [editingText, setEditingText] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'xhs' | 'pyq'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [editingContent, setEditingContent] = useState<ContentRecord | null>(null)
  const PAGE_SIZE = 20

  const loadRecords = useCallback(async (silent = false, pageNum = page) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(PAGE_SIZE),
      })
      if (filterPlatform !== 'all') params.set('platform', filterPlatform)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/contents?${params}`)
      const data = await res.json()
      setRecords(Array.isArray(data.contents) ? data.contents : [])
      setTotal(data.total || 0)
      setLastRefreshed(new Date())
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page, filterPlatform, search])

  useEffect(() => { loadRecords() }, [loadRecords])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadRecords(true)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [loadRecords])

  const deleteRecord = async (id: string) => {
    if (!confirm("确认删除这条记录？")) return
    await fetch(`/api/contents?id=${id}`, { method: "DELETE", headers: authHeaders() })
    setRecords(prev => prev.filter(r => r.id !== id))
    if (selectedRecord?.id === id) setSelectedRecord(null)
    const newSelected = new Set(selectedIds)
    newSelected.delete(id)
    setSelectedIds(newSelected)
  }

  const openDetail = (record: ContentRecord) => {
    setSelectedRecord(record)
    setEditingText(record.cleanedText || "")
    setEditMode(false)
  }

  const handleSaveEdit = async () => {
    if (!selectedRecord) return
    setSaving(true)
    try {
      const res = await fetch("/api/contents", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: selectedRecord.id, cleanedText: editingText }),
      })
      if (res.ok) {
        setRecords(prev => prev.map(r =>
          r.id === selectedRecord.id ? { ...r, cleanedText: editingText } : r
        ))
        setSelectedRecord(prev => prev ? { ...prev, cleanedText: editingText } : null)
        setEditMode(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    const filtered = records.filter(r => filterPlatform === 'all' || r.platform === filterPlatform)
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)))
    }
  }

  const exportExcel = (exportSelected = false) => {
    setExporting(true)
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const targetRecords = exportSelected 
        ? records.filter(r => selectedIds.has(r.id))
        : records.filter(r => filterPlatform === 'all' || r.platform === filterPlatform)

      const data = targetRecords.map((r, i) => {
        let coverParsed: any = {}
        try { coverParsed = r.coverData ? JSON.parse(r.coverData) : {} } catch {}
        if (r.platform === 'pyq') {
          return {
            序号: i + 1,
            平台: '朋友圈',
            客户姓名: r.customer?.name || "-",
            客户分类: r.customer?.category || "-",
            微信号: r.customer?.wechatId || "-",
            文案: r.cleanedText || "-",
            配图1: r.image2Url ? `${baseUrl}${r.image2Url}` : "-",
            配图2: r.image3Url ? `${baseUrl}${r.image3Url}` : "-",
            配图3: r.image4Url ? `${baseUrl}${r.image4Url}` : "-",
            处理时间: new Date(r.createdAt).toLocaleString("zh-CN"),
          }
        }
        return {
          序号: i + 1,
          平台: '小红书',
          客户姓名: r.customer?.name || "-",
          客户分类: r.customer?.category || "-",
          小红书账号: r.customer?.xhsAccount || "-",
          封面主标题: r.title || coverParsed?.title || "-",
          封面副标题: r.subtitle || coverParsed?.subtitle || "-",
          "去 AI化文案": r.cleanedText || "-",
          话题标签: coverParsed?.tags?.map((t: string) => `#${t}`).join(" ") || "-",
          封面图URL: r.coverUrl ? `${baseUrl}${r.coverUrl}` : "-",
          第2张配图: r.image2Url ? `${baseUrl}${r.image2Url}` : "-",
          第3张配图: r.image3Url ? `${baseUrl}${r.image3Url}` : "-",
          处理时间: new Date(r.createdAt).toLocaleString("zh-CN"),
        }
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "分发内容")
      const filename = exportSelected ? `批量导出_${selectedIds.size}条` : `${filterPlatform}_分发内容`
      XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const filteredRecords = records
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 内容编辑弹窗 */}
      {editingContent && (
        <ContentEditModal
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSaved={(updated) => {
            setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
            if (selectedRecord?.id === updated.id) setSelectedRecord(prev => prev ? { ...prev, ...updated } : null)
            setEditingContent(null)
          }}
        />
      )}
      {/* 左侧列表 */}
      <div className="w-96 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">处理结果 <span className="text-sm font-normal text-gray-400">({total})</span></h1>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              <button onClick={() => setFilterPlatform('all')} className={`p-1.5 rounded-md ${filterPlatform === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`} title="全部"><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setFilterPlatform('xhs')} className={`p-1.5 rounded-md ${filterPlatform === 'xhs' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'}`} title="小红书"><Smartphone className="w-4 h-4" /></button>
              <button onClick={() => setFilterPlatform('pyq')} className={`p-1.5 rounded-md ${filterPlatform === 'pyq' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`} title="朋友圈"><MessageCircle className="w-4 h-4" /></button>
            </div>
          </div>
          
          {/* 搜索框 */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索客户名或文案内容..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => loadRecords()} disabled={loading} className="flex-1 h-8 text-xs">
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> 刷新
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSelectAll} className="flex-1 h-8 text-xs">
              {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare className="w-3 h-3 mr-1" /> : <Square className="w-3 h-3 mr-1" />}
              全选
            </Button>
          </div>

          {selectedIds.size > 0 ? (
            <Button onClick={() => exportExcel(true)} className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
              <Download className="w-4 h-4 mr-2" /> 导出选中 ({selectedIds.size})
            </Button>
          ) : (
            <Button onClick={() => exportExcel(false)} disabled={filteredRecords.length === 0 || exporting} className="w-full h-9 bg-green-600 hover:bg-green-700 text-white text-sm">
              <Download className="w-4 h-4 mr-2" /> 导出当前列表
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">加载中...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">暂无处理记录</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              let coverData: CoverDataV3 | null = null
              try { coverData = record.coverData ? JSON.parse(record.coverData) : null } catch {}
              const isSelected = selectedRecord?.id === record.id
              const isChecked = selectedIds.has(record.id)
              return (
                <div
                  key={record.id}
                  onClick={() => openDetail(record)}
                  className={`p-3 border-b border-gray-50 cursor-pointer transition-colors relative group ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  <div className="flex gap-3">
                    <div onClick={(e) => toggleSelect(record.id, e)} className="flex-shrink-0 self-center">
                      {isChecked ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />}
                    </div>
                    <div className="flex-shrink-0 w-14 h-[75px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {record.platform === 'xhs' && coverData ? (
                        <div style={{ width: 56, height: 75, overflow: "hidden" }}>
                          <div style={{ width: 375, height: 600, transform: "scale(0.149)", transformOrigin: "top left" }}>
                            <XhsCoverCardV3 data={coverData} scale={1} />
                          </div>
                        </div>
                      ) : record.image2Url ? (
                        <img src={record.image2Url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">无预览</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-gray-800 truncate">{record.customer?.name || "未知"}</div>
                        {record.platform === 'xhs' ? <Smartphone className="w-3 h-3 text-red-400" /> : <MessageCircle className="w-3 h-3 text-green-400" />}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{record.customer?.category || record.customer?.occupation || ""}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {record.cleanedText?.substring(0, 50)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >上一页</button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >下一页</button>
          </div>
        )}
      </div>

      {/* 右侧详情 */}
      {selectedRecord ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${selectedRecord.platform === 'xhs' ? 'bg-red-500' : 'bg-green-500'}`}>
                  {selectedRecord.customer?.name?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRecord.customer?.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedRecord.platform === 'xhs' ? '小红书' : '朋友圈'} · {selectedRecord.customer?.occupation}
                    {selectedRecord.customer?.city && ` · ${selectedRecord.customer.city}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => setEditingContent(selectedRecord)} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="编辑内容"><Edit2 className="w-5 h-5" /></button>
                )}
                {isAdmin && (
                  <button onClick={() => deleteRecord(selectedRecord.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">原始文案</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-600">{selectedRecord.originalText}</div>
                </section>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">清洗后文案</h3>
                    <button onClick={() => setEditMode(!editMode)} className="text-xs text-indigo-600 hover:underline">{editMode ? "取消编辑" : "编辑文案"}</button>
                  </div>
                  {editMode ? (
                    <div className="space-y-3">
                      <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full h-48 p-4 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <Button onClick={handleSaveEdit} disabled={saving} className="w-full bg-indigo-600 text-white">{saving ? "保存中..." : "保存修改"}</Button>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.cleanedText}</div>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">配图预览</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRecord.platform === 'xhs' && (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border relative">
                      {selectedRecord.coverUrl ? <img src={selectedRecord.coverUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">封面生成中</div>}
  
                    </div>
                  )}
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border relative">
                    {selectedRecord.image2Url ? <img src={selectedRecord.image2Url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无配图</div>}

                  </div>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border relative">
                    {selectedRecord.image3Url ? <img src={selectedRecord.image3Url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无配图</div>}

                  </div>
                  {selectedRecord.platform === 'pyq' && (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border relative">
                      {selectedRecord.image4Url ? <img src={selectedRecord.image4Url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无配图</div>}

                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white">
          <div className="text-6xl mb-4">👈</div>
          <p>请从左侧选择一条记录查看详情</p>
        </div>
      )}
    </div>
  )
}
