'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'

interface Material {
  id: string
  filename: string
  filepath: string
  webPath: string
  productLine: string
  productName: string
  sceneType: string
  isFormula: boolean
  isProduct: boolean
  tags: string | null
  status: string
  createdAt: string
}

function encodeWebPath(webPath: string): string {
  return webPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

const PRODUCT_LINES = ['all', '草本茶饮', '草本咖啡', '品牌通用']
const SCENE_TYPES = ['all', '产品图', '场景图', '冲泡图', '配方图']

const PRODUCT_LINE_COLORS: Record<string, string> = {
  '草本茶饮': 'bg-green-100 text-green-700 border-green-200',
  '草本咖啡': 'bg-amber-100 text-amber-700 border-amber-200',
  '品牌通用': 'bg-blue-100 text-blue-700 border-blue-200',
}

const SCENE_TYPE_COLORS: Record<string, string> = {
  '产品图': 'bg-orange-100 text-orange-700',
  '场景图': 'bg-blue-100 text-blue-700',
  '冲泡图': 'bg-purple-100 text-purple-700',
  '配方图': 'bg-green-100 text-green-700',
}

// 产品名称选项（按产品线分组）
const PRODUCT_OPTIONS: Record<string, string[]> = {
  '草本茶饮': ['补气焕活草本茶饮', '湿祛轻畅草本定制茶饮', '红颜透润草本定制茶饮', '清脂纤纤草本定制茶饮', '通用'],
  '草本咖啡': ['悦活草本美式', '悦纤草本美式', '悦轻草本美式', '悦颜草本美式', '通用'],
  '品牌通用': ['店铺场景', '品牌宣传', '节日活动', '通用'],
}

// 预设场景标签（按使用场景分组）
const PRESET_TAGS: Record<string, string[]> = {
  '人群场景': ['职场', '通勤', '妈妈', '银发族', '学生', '健身', '居家', '户外'],
  '时间场景': ['早晨', '午后', '深夜', '周末', '节假日'],
  '情绪氛围': ['轻松', '专注', '活力', '温馨', '精致', '自然'],
  '使用场景': ['办公桌', '咖啡馆', '户外运动', '会议室', '家庭', '旅行'],
}

// 标签多选组件
function TagSelector({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [customInput, setCustomInput] = useState('')

  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setCustomInput('')
  }

  return (
    <div className="space-y-2">
      {/* 已选标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="hover:text-green-200 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 预设标签 */}
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {Object.entries(PRESET_TAGS).map(([group, tags]) => (
          <div key={group}>
            <div className="text-xs text-gray-400 mb-1">{group}</div>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                    value.includes(tag)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 自定义标签输入 */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="自定义标签，回车添加"
          className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
        >
          添加
        </button>
      </div>
    </div>
  )
}

// 标签编辑弹窗
function TagEditModal({
  material,
  onClose,
  onSaved,
  authHeaders,
}: {
  material: Material
  onClose: () => void
  onSaved: (updated: Material) => void
  authHeaders: () => Record<string, string>
}) {
  const [tags, setTags] = useState<string[]>(
    material.tags ? material.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  )
  const [sceneType, setSceneType] = useState(material.sceneType)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/materials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          id: material.id,
          tags: tags.join(','),
          sceneType,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || '保存失败')
        return
      }
      const updated = await res.json()
      onSaved(updated)
      onClose()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">编辑素材标签</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{material.filename}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 素材类型 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">素材类型</label>
            <div className="flex flex-wrap gap-2">
              {['产品图', '场景图', '冲泡图', '配方图'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSceneType(type)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    sceneType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 场景标签 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              场景标签
              <span className="text-gray-400 font-normal ml-1">（多选，用于 AI 智能匹配配图）</span>
            </label>
            <TagSelector value={tags} onChange={setTags} />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 text-sm text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MaterialsPage() {
  const { isAdmin, authHeaders } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [productLine, setProductLine] = useState('all')
  const [sceneType, setSceneType] = useState('all')
  const [search, setSearch] = useState('')
  const [previewImg, setPreviewImg] = useState<Material | null>(null)
  const [editTagTarget, setEditTagTarget] = useState<Material | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadForm, setUploadForm] = useState({
    productLine: '草本茶饮',
    productName: '补气焕活草本茶饮',
    sceneType: '场景图',
    tags: [] as string[],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ productLine, sceneType, search })
      const res = await fetch(`/api/materials?${params}`)
      const data = await res.json()
      setMaterials(data.materials || [])
    } finally {
      setLoading(false)
    }
  }, [productLine, sceneType, search])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // 当产品线变化时，自动更新产品名
  useEffect(() => {
    const options = PRODUCT_OPTIONS[uploadForm.productLine] || []
    if (options.length > 0 && !options.includes(uploadForm.productName)) {
      setUploadForm(f => ({ ...f, productName: options[0] }))
    }
  }, [uploadForm.productLine, uploadForm.productName])

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`确认删除素材「${filename}」？此操作不可恢复。`)) return
    const res = await fetch(`/api/materials?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) {
      setMaterials(prev => prev.filter(m => m.id !== id))
      if (previewImg?.id === id) setPreviewImg(null)
    } else {
      alert('删除失败，请先登录管理员账户')
    }
  }

  const doUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    if (!isAdmin) {
      setUploadError('请先登录管理员账户才能上传素材')
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      let successCount = 0
      let failCount = 0
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('productLine', uploadForm.productLine)
        fd.append('productName', uploadForm.productName || '通用')
        fd.append('sceneType', uploadForm.sceneType)
        fd.append('tags', uploadForm.tags.join(','))
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: authHeaders(),   // ← 携带管理员 Token
          body: fd,
        })
        if (res.ok) {
          successCount++
        } else {
          failCount++
          const d = await res.json().catch(() => ({}))
          console.error('上传失败:', d.error)
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchMaterials()
      if (failCount > 0) {
        setUploadError(`${successCount} 张上传成功，${failCount} 张失败`)
      } else {
        setUploadError('')
        alert(`成功上传 ${successCount} 张图片`)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return setUploadError('请选择图片文件')
    await doUpload(files)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) await doUpload(files)
  }

  // 标签编辑保存回调
  const handleTagSaved = (updated: Material) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m))
    if (previewImg?.id === updated.id) setPreviewImg(updated)
  }

  // 按产品名分组
  const grouped: Record<string, Material[]> = {}
  for (const m of materials) {
    const key = `${m.productLine}|||${m.productName}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  }

  // 排序：品牌通用最后
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const lineA = a.split('|||')[0]
    const lineB = b.split('|||')[0]
    const order = ['草本茶饮', '草本咖啡', '品牌通用']
    return order.indexOf(lineA) - order.indexOf(lineB)
  })

  const totalCount = materials.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">封面插画素材库</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 <span className="font-semibold text-gray-700">{totalCount}</span> 张素材 · 支持上传、预览、标签编辑、删除
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['草本茶饮', '草本咖啡', '品牌通用'].map(line => {
              const count = materials.filter(m => m.productLine === line).length
              return (
                <div key={line} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${PRODUCT_LINE_COLORS[line]}`}>
                  {line} · {count}张
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：上传面板 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-lg">📤</span> 上传新素材
                {!isAdmin && (
                  <span className="ml-auto text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    需登录
                  </span>
                )}
              </h2>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">产品线</label>
                  <select
                    value={uploadForm.productLine}
                    onChange={e => setUploadForm(f => ({ ...f, productLine: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="草本茶饮">草本茶饮</option>
                    <option value="草本咖啡">草本咖啡</option>
                    <option value="品牌通用">品牌通用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">产品名称</label>
                  <select
                    value={uploadForm.productName}
                    onChange={e => setUploadForm(f => ({ ...f, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {(PRODUCT_OPTIONS[uploadForm.productLine] || []).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">素材类型</label>
                  <select
                    value={uploadForm.sceneType}
                    onChange={e => setUploadForm(f => ({ ...f, sceneType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="产品图">产品图（封面主图）</option>
                    <option value="场景图">场景图（场景配图）</option>
                    <option value="冲泡图">冲泡图（制作过程）</option>
                    <option value="配方图">配方图（原料展示）</option>
                  </select>
                </div>

                {/* 场景标签多选 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    场景标签
                    <span className="text-gray-400 font-normal ml-1">（可多选）</span>
                  </label>
                  <TagSelector
                    value={uploadForm.tags}
                    onChange={tags => setUploadForm(f => ({ ...f, tags }))}
                  />
                </div>

                {/* 拖拽上传区 */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
                  } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onDragOver={e => { e.preventDefault(); if (isAdmin) setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => isAdmin && fileInputRef.current?.click()}
                >
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? '点击或拖拽图片到此处' : '请先登录管理员账户'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">支持 PNG / JPG，可多选</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && doUpload(e.target.files)}
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
                )}

                <button
                  type="submit"
                  disabled={uploading || !isAdmin}
                  className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? '上传中...' : !isAdmin ? '请先登录' : '确认上传'}
                </button>
              </form>
            </div>

            {/* 使用说明 */}
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
              <h3 className="text-xs font-bold text-amber-700 mb-2">📌 素材使用说明</h3>
              <div className="text-xs text-amber-600 space-y-1.5">
                <p>• <strong>产品图</strong>：作为封面主插画，每个产品可有多张（通用/职场/妈妈/银发族等场景）</p>
                <p>• <strong>场景图</strong>：笔记第2、3张配图，根据文案场景智能匹配</p>
                <p>• <strong>品牌通用</strong>：店铺形象、品牌宣传等通用素材</p>
                <p>• <strong>场景标签</strong>：点击图片卡片上的「编辑」按钮可随时修改标签</p>
              </div>
            </div>
          </div>

          {/* 右侧：素材展示 */}
          <div className="lg:col-span-3">
            {/* 筛选栏 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 self-center">产品线：</span>
                  {PRODUCT_LINES.map(pl => (
                    <button
                      key={pl}
                      onClick={() => setProductLine(pl)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        productLine === pl
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {pl === 'all' ? '全部' : pl}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 self-center">类型：</span>
                  {SCENE_TYPES.map(st => (
                    <button
                      key={st}
                      onClick={() => setSceneType(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        sceneType === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {st === 'all' ? '全部' : st}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="搜索产品名/标签..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400 w-36 ml-auto"
                />
              </div>
            </div>

            {/* 素材网格 */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-spin">⏳</div>
                  <p className="text-sm">加载中...</p>
                </div>
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-sm">暂无素材</p>
                <p className="text-xs mt-1">请在左侧上传图片</p>
              </div>
            ) : (
              <div className="space-y-5">
                {sortedGroups.map(([groupKey, items]) => {
                  const [line, name] = groupKey.split('|||')
                  return (
                    <div key={groupKey} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRODUCT_LINE_COLORS[line] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {line}
                        </span>
                        <h3 className="font-bold text-gray-700 text-sm">{name}</h3>
                        <span className="text-xs text-gray-400 font-normal">({items.length}张)</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                        {items.map(m => {
                          const tagList = m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                          return (
                            <div key={m.id} className="group relative">
                              <div
                                className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer border-2 border-transparent hover:border-green-400 transition-all shadow-sm relative"
                                onClick={() => setPreviewImg(m)}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={encodeWebPath(m.webPath)}
                                  alt={m.filename}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  onError={e => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-300 text-xs p-1 text-center">图片加载失败</div>'
                                  }}
                                />
                                {/* 悬浮遮罩 */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/50 px-2 py-1 rounded transition-opacity">
                                    预览
                                  </span>
                                </div>
                              </div>

                              {/* 类型标签 + 操作按钮 */}
                              <div className="mt-1 flex items-center justify-between gap-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full truncate flex-1 ${SCENE_TYPE_COLORS[m.sceneType] || 'bg-gray-100 text-gray-600'}`}>
                                  {m.sceneType}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  {isAdmin && (
                                    <button
                                      onClick={() => setEditTagTarget(m)}
                                      className="text-xs text-blue-400 hover:text-blue-600"
                                      title="编辑标签"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(m.id, m.filename)}
                                      className="text-xs text-red-400 hover:text-red-600"
                                      title="删除"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* 场景标签展示 */}
                              {tagList.length > 0 ? (
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                  {tagList.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-1 rounded leading-tight">
                                      {tag}
                                    </span>
                                  ))}
                                  {tagList.length > 3 && (
                                    <span className="text-xs text-gray-300 leading-tight">+{tagList.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                isAdmin && (
                                  <button
                                    onClick={() => setEditTagTarget(m)}
                                    className="text-xs text-gray-300 hover:text-blue-400 mt-0.5 leading-tight transition-colors"
                                  >
                                    + 添加标签
                                  </button>
                                )
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={encodeWebPath(previewImg.webPath)}
              alt={previewImg.filename}
              className="w-full object-contain max-h-[55vh]"
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{previewImg.filename}</div>
                  <div className="text-xs text-gray-500 mt-1.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${PRODUCT_LINE_COLORS[previewImg.productLine] || ''}`}>
                        {previewImg.productLine}
                      </span>
                      <span className="text-gray-600">{previewImg.productName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs ${SCENE_TYPE_COLORS[previewImg.sceneType] || 'bg-gray-100 text-gray-600'}`}>
                        {previewImg.sceneType}
                      </span>
                      {previewImg.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {previewImg.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">暂无场景标签</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => { setEditTagTarget(previewImg); setPreviewImg(null) }}
                      className="px-3 py-1.5 text-xs text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ✏️ 编辑标签
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(previewImg.id, previewImg.filename)}
                      className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewImg(null)}
                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签编辑弹窗 */}
      {editTagTarget && (
        <TagEditModal
          material={editTagTarget}
          onClose={() => setEditTagTarget(null)}
          onSaved={handleTagSaved}
          authHeaders={authHeaders}
        />
      )}
    </div>
  )
}
