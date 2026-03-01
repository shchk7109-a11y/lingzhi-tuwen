'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import AdminLoginModal from '@/components/AdminLoginModal'

interface Prompt {
  id: string
  key: string
  name: string
  description?: string
  content: string
  category: string
  updatedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'content': '🧹 去AI化文案',
  'clean': '🧹 去AI化文案',
  'cover': '🎨 封面生成',
  'match': '🖼️ 配图匹配',
  'general': '⚙️ 通用',
}

const CATEGORY_COLORS: Record<string, string> = {
  'content': 'bg-blue-100 text-blue-700',
  'clean': 'bg-blue-100 text-blue-700',
  'cover': 'bg-green-100 text-green-700',
  'match': 'bg-purple-100 text-purple-700',
  'general': 'bg-gray-100 text-gray-600',
}

export default function PromptsPage() {
  const { isAdmin, authHeaders } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompts')
      const data = await res.json()
      setPrompts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadPrompts()
  }, [isAdmin, loadPrompts])

  const openEdit = (p: Prompt) => {
    setSelectedPrompt(p)
    setEditContent(p.content)
    setEditName(p.name)
    setEditDesc(p.description || '')
    setSaved(false)
  }

  const handleSave = async () => {
    if (!selectedPrompt) return
    setSaving(true)
    try {
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          id: selectedPrompt.id,
          name: editName,
          description: editDesc,
          content: editContent,
          category: selectedPrompt.category,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p))
        setSelectedPrompt(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  // 按分类分组
  const grouped: Record<string, Prompt[]> = {}
  for (const p of prompts) {
    if (!grouped[p.category]) grouped[p.category] = []
    grouped[p.category].push(p)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">提示词管理</h1>
          <p className="text-sm text-gray-500 mb-6">此页面仅管理员可访问，请先验证身份</p>
          <button
            onClick={() => setShowLogin(true)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
          >
            管理员登录
          </button>
        </div>
        {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} onSuccess={loadPrompts} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧列表 */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">提示词工程</h1>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">管理员</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">管理AI生成各环节的提示词</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {CATEGORY_LABELS[cat] || cat}
                </div>
                <div className="space-y-1">
                  {items.map(p => (
                    <button
                      key={p.id}
                      onClick={() => openEdit(p)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                        selectedPrompt?.id === p.id
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>
                          {p.category}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧编辑区 */}
      {selectedPrompt ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-green-400 focus:outline-none bg-transparent"
                />
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selectedPrompt.category] || 'bg-gray-100'}`}>
                  {CATEGORY_LABELS[selectedPrompt.category] || selectedPrompt.category}
                </span>
              </div>
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="添加描述..."
                className="text-sm text-gray-500 mt-1 border-b border-transparent hover:border-gray-200 focus:border-green-400 focus:outline-none bg-transparent w-full"
              />
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-green-600">✓ 已保存</span>}
              <span className="text-xs text-gray-400">
                Key: <code className="bg-gray-100 px-1 rounded">{selectedPrompt.key}</code>
              </span>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">提示词内容</label>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{editContent.length} 字符</span>
                  <span>最后更新：{new Date(selectedPrompt.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="flex-1 min-h-96 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-gray-50"
                spellCheck={false}
              />
            </div>

            {/* 变量说明 */}
            <div className="mt-4 bg-yellow-50 rounded-xl border border-yellow-100 p-4">
              <h3 className="text-xs font-bold text-yellow-700 mb-2">可用变量（用 {'{{'} 变量名 {'}}'}  引用）</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-yellow-600">
                <div><code className="bg-yellow-100 px-1 rounded">{'{{originalText}}'}</code> 原始文案内容</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{customerName}}'}</code> 客户姓名</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{occupation}}'}</code> 职业</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{painPoints}}'}</code> 痛点</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{needs}}'}</code> 需求</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{scenes}}'}</code> 使用场景</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{language}}'}</code> 语言风格</div>
                <div><code className="bg-yellow-100 px-1 rounded">{'{{lifestyle}}'}</code> 生活方式</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-4">✍️</div>
            <p className="text-lg">选择左侧提示词进行编辑</p>
            <p className="text-sm mt-2">修改提示词将影响AI生成的内容质量</p>
          </div>
        </div>
      )}
    </div>
  )
}
