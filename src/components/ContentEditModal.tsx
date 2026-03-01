'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface ContentEditModalProps {
  content: {
    id: string
    cleanedText?: string | null
    title?: string | null
    subtitle?: string | null
    image2Url?: string | null
    image3Url?: string | null
    image4Url?: string | null
    coverData?: string | null
    customerName?: string | null
    platform?: string | null
  }
  onClose: () => void
  onSaved: (updated: any) => void
}

export default function ContentEditModal({ content, onClose, onSaved }: ContentEditModalProps) {
  const { authHeaders } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [cleanedText, setCleanedText] = useState(content.cleanedText || '')
  const [title, setTitle] = useState(content.title || '')
  const [subtitle, setSubtitle] = useState(content.subtitle || '')
  const [image2Url, setImage2Url] = useState(content.image2Url || '')
  const [image3Url, setImage3Url] = useState(content.image3Url || '')
  const [image4Url, setImage4Url] = useState(content.image4Url || '')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/contents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          id: content.id,
          cleanedText,
          title,
          subtitle,
          image2Url,
          image3Url,
          image4Url,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }
      const updated = await res.json()
      onSaved(updated)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">编辑内容</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {content.customerName} · {content.platform === 'xhs' ? '小红书' : '朋友圈'}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>

          <div className="space-y-4">
            {/* 文案 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                优化后文案
              </label>
              <textarea
                value={cleanedText}
                onChange={(e) => setCleanedText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                placeholder="优化后的文案内容..."
              />
              <div className="text-xs text-slate-400 text-right mt-0.5">{cleanedText.length} 字</div>
            </div>

            {/* 小红书封面字段（仅 xhs 平台显示） */}
            {content.platform === 'xhs' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">封面标题</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="封面主标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">封面副标题</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="封面副标题"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 图片 URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">配图 2</label>
              <input
                type="text"
                value={image2Url}
                onChange={(e) => setImage2Url(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="/materials/..."
              />
              {image2Url && (
                <img src={image2Url} alt="配图2预览" className="mt-2 h-20 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">配图 3</label>
              <input
                type="text"
                value={image3Url}
                onChange={(e) => setImage3Url(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="/materials/..."
              />
              {image3Url && (
                <img src={image3Url} alt="配图3预览" className="mt-2 h-20 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">配图 4</label>
              <input
                type="text"
                value={image4Url}
                onChange={(e) => setImage4Url(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="/materials/..."
              />
              {image4Url && (
                <img src={image4Url} alt="配图4预览" className="mt-2 h-20 rounded-lg object-cover" />
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
