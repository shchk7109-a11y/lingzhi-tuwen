'use client'

import { useState, useEffect, useCallback } from 'react'

interface Customer {
  id: string
  name: string
  nickname?: string
  gender?: string
  age?: number
  occupation?: string
  city?: string
  income?: string
  category: string
  lifestyle?: string
  painPoints?: string
  needs?: string
  scenes?: string
  language?: string
  xhsAccount?: string
  wechatId?: string
  status: string
  _count?: { contents: number }
}

const CATEGORIES = ['all', '职场精英型', '精致妈妈型', '学生党', '养生达人型', '银发族']
const CATEGORY_COLORS: Record<string, string> = {
  '职场精英型': 'bg-blue-100 text-blue-700 border-blue-200',
  '精致妈妈型': 'bg-pink-100 text-pink-700 border-pink-200',
  '学生党': 'bg-purple-100 text-purple-700 border-purple-200',
  '养生达人型': 'bg-green-100 text-green-700 border-green-200',
  '银发族': 'bg-orange-100 text-orange-700 border-orange-200',
}

const emptyForm = {
  name: '', nickname: '', gender: '女', age: '', occupation: '', city: '',
  income: '', category: '职场精英型', lifestyle: '', painPoints: '',
  needs: '', scenes: '', language: '', xhsAccount: '', wechatId: '',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15
  // 客户队列状态：剩余队列中的客户 ID（不在其中的表示本轮已分配）
  const [queueIds, setQueueIds] = useState<Set<string>>(new Set())
  const [queueTotal, setQueueTotal] = useState(0)
  const [queueRemaining, setQueueRemaining] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showDetail, setShowDetail] = useState<Customer | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category,
        search,
        page: String(page),
        pageSize: String(pageSize),
      })
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [category, search, page])

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/customers/queue')
      if (res.ok) {
        const data = await res.json()
        setQueueIds(new Set(data.queue || []))
        setQueueTotal(data.total || 0)
        setQueueRemaining(data.remaining || 0)
      }
    } catch {}
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { fetchQueue() }, [fetchQueue])

  const openAdd = () => {
    setEditingCustomer(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (c: Customer) => {
    setEditingCustomer(c)
    setForm({
      name: c.name || '',
      nickname: c.nickname || '',
      gender: c.gender || '女',
      age: c.age ? String(c.age) : '',
      occupation: c.occupation || '',
      city: c.city || '',
      income: c.income || '',
      category: c.category || '职场精英型',
      lifestyle: c.lifestyle || '',
      painPoints: c.painPoints || '',
      needs: c.needs || '',
      scenes: c.scenes || '',
      language: c.language || '',
      xhsAccount: c.xhsAccount || '',
      wechatId: (c as any).wechatId || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('请填写客户名称')
    setSaving(true)
    try {
      const method = editingCustomer ? 'PUT' : 'POST'
      const body = editingCustomer ? { ...form, id: editingCustomer.id } : form
      const res = await fetch('/api/customers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowModal(false)
        fetchCustomers()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除客户「${name}」？此操作不可恢复。`)) return
    const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchCustomers()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">共 {total} 位客户</p>
              {queueTotal > 0 && (
                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  本轮进度：已分配 {queueTotal - queueRemaining}/{queueTotal}，剩余 {queueRemaining} 位客户待分配
                </span>
              )}
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <span>＋</span> 添加客户
          </button>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                category === cat
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="搜索客户名、职业、城市、小红书账号..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              清除
            </button>
          )}
        </div>

        {/* 客户表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">加载中...</div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p>暂无客户数据</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">客户</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">分类</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">职业</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">城市</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">小红书账号</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">本轮状态</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">文案数</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        {c.nickname && c.nickname !== c.name && (
                          <div className="text-xs text-gray-400">{c.nickname}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[c.category] || 'bg-gray-100 text-gray-600'}`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.occupation || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.city || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.xhsAccount || '-'}</td>
                    <td className="px-4 py-3">
                      {queueTotal > 0 ? (
                        queueIds.has(c.id) ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">⏳ 待分配</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">✓ 本轮已分配</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 font-medium">{c._count?.contents || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDetail(c)}
                          className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 条，共 {total} 条
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑/新增弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? '编辑客户' : '添加客户'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户名称 *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="显示名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                  <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="小红书昵称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value="女">女</option>
                    <option value="男">男</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：28" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">职业</label>
                  <input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：互联网运营" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：上海" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收入</label>
                  <input value={form.income} onChange={e => setForm(f => ({ ...f, income: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：15-20K" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户分类</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {CATEGORIES.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">小红书账号</label>
                <input value={form.xhsAccount} onChange={e => setForm(f => ({ ...f, xhsAccount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：@小陈不加班" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
                <input value={(form as any).wechatId || ''} onChange={e => setForm(f => ({ ...f, wechatId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：wx_xiaoming123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生活方式</label>
                <textarea value={form.lifestyle} onChange={e => setForm(f => ({ ...f, lifestyle: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="作息、消费习惯、社交方式等" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">痛点/困扰</label>
                <textarea value={form.painPoints} onChange={e => setForm(f => ({ ...f, painPoints: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="健康困扰、生活痛点等" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">购买需求</label>
                <textarea value={form.needs} onChange={e => setForm(f => ({ ...f, needs: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="购买动机、核心需求" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">饮用场景</label>
                <input value={form.scenes} onChange={e => setForm(f => ({ ...f, scenes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="如：办公室下午茶、加班时" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">语言风格</label>
                <textarea value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="口头禅、表情习惯、句式特点、网络语使用程度等" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 客户详情弹窗 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{showDetail.name} 的背景资料</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['昵称', showDetail.nickname],
                  ['性别', showDetail.gender],
                  ['年龄', showDetail.age ? `${showDetail.age}岁` : '-'],
                  ['职业', showDetail.occupation],
                  ['城市', showDetail.city],
                  ['收入', showDetail.income],
                  ['分类', showDetail.category],
                  ['小红书账号', showDetail.xhsAccount],
                  ['微信号', (showDetail as any).wechatId],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className="text-gray-800 font-medium">{(value as string) || '-'}</div>
                  </div>
                ))}
              </div>
              {showDetail.lifestyle && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-400 mb-1">生活方式</div>
                  <div className="text-gray-700">{showDetail.lifestyle}</div>
                </div>
              )}
              {showDetail.painPoints && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-xs text-red-400 mb-1">痛点/困扰</div>
                  <div className="text-gray-700">{showDetail.painPoints}</div>
                </div>
              )}
              {showDetail.needs && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-400 mb-1">购买需求</div>
                  <div className="text-gray-700">{showDetail.needs}</div>
                </div>
              )}
              {showDetail.scenes && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-yellow-600 mb-1">饮用场景</div>
                  <div className="text-gray-700">{showDetail.scenes}</div>
                </div>
              )}
              {showDetail.language && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-400 mb-1">语言风格</div>
                  <div className="text-gray-700">{showDetail.language}</div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => { setShowDetail(null); openEdit(showDetail) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                编辑
              </button>
              <button onClick={() => setShowDetail(null)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
