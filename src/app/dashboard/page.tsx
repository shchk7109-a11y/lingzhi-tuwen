'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AdminLoginModal from '@/components/AdminLoginModal'

interface StatsData {
  overview: {
    totalContents: number
    todayContents: number
    last7DaysContents: number
    last30DaysContents: number
    totalCustomers: number
    totalMaterials: number
  }
  platformStats: Array<{ platform: string; count: number }>
  categoryStats: Array<{ category: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  topCustomers: Array<{ name: string; count: number }>
  materialsByLine: Array<{ productLine: string; count: number }>
}

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    fetchStats()
  }, [isAdmin])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('获取统计数据失败')
      const data = await res.json()
      setStats(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">数据统计 Dashboard</h2>
          <p className="text-slate-500 mb-6">此页面需要管理员权限</p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
          >
            管理员登录
          </button>
        </div>
        {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} />}
      </div>
    )
  }

  const maxDailyCount = stats ? Math.max(...stats.dailyTrend.map((d) => d.count), 1) : 1
  const maxCategoryCount = stats ? Math.max(...stats.categoryStats.map((c) => c.count), 1) : 1

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">数据统计 Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">实时展示系统运营数据</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            刷新数据
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400 text-sm">加载中...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: '总内容数', value: stats.overview.totalContents, icon: '📝', color: 'bg-blue-50 border-blue-100' },
                { label: '今日生成', value: stats.overview.todayContents, icon: '⚡', color: 'bg-green-50 border-green-100' },
                { label: '近7天', value: stats.overview.last7DaysContents, icon: '📅', color: 'bg-indigo-50 border-indigo-100' },
                { label: '近30天', value: stats.overview.last30DaysContents, icon: '📆', color: 'bg-purple-50 border-purple-100' },
                { label: '活跃客户', value: stats.overview.totalCustomers, icon: '👥', color: 'bg-orange-50 border-orange-100' },
                { label: '素材总数', value: stats.overview.totalMaterials, icon: '🖼️', color: 'bg-pink-50 border-pink-100' },
              ].map((card) => (
                <div key={card.label} className={`${card.color} border rounded-xl p-4`}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-2xl font-bold text-slate-800">{card.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 近14天生成趋势 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-4">近14天生成趋势</h3>
                {stats.dailyTrend.length === 0 ? (
                  <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
                ) : (
                  <div className="flex items-end gap-1 h-36">
                    {stats.dailyTrend.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-xs text-slate-400 font-mono">{d.count}</div>
                        <div
                          className="w-full bg-indigo-400 rounded-t transition-all"
                          style={{ height: `${Math.max((d.count / maxDailyCount) * 100, 4)}%` }}
                          title={`${d.date}: ${d.count} 条`}
                        />
                        <div className="text-[9px] text-slate-400 rotate-45 origin-left whitespace-nowrap">
                          {d.date.slice(5)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 平台分布 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-4">平台分布</h3>
                <div className="space-y-3">
                  {stats.platformStats.map((p) => {
                    const total = stats.platformStats.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
                    const label = p.platform === 'xhs' ? '小红书' : p.platform === 'moments' ? '朋友圈' : p.platform
                    return (
                      <div key={p.platform}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{label}</span>
                          <span className="font-medium text-slate-800">{p.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {stats.platformStats.length === 0 && (
                    <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 客户分类分布（近30天） */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-4">客户分类（近30天）</h3>
                <div className="space-y-2.5">
                  {stats.categoryStats.map((c) => (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 truncate max-w-[140px]">{c.category}</span>
                        <span className="font-medium text-slate-700 ml-2">{c.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${(c.count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {stats.categoryStats.length === 0 && (
                    <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
                  )}
                </div>
              </div>

              {/* Top 10 活跃客户 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-4">Top 10 活跃客户（近30天）</h3>
                <div className="space-y-2">
                  {stats.topCustomers.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-slate-400 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-slate-100 text-slate-500'
                      }`}>{i + 1}</span>
                      <span className="text-sm text-slate-600 flex-1 truncate">{c.name}</span>
                      <span className="text-sm font-medium text-slate-800">{c.count}</span>
                    </div>
                  ))}
                  {stats.topCustomers.length === 0 && (
                    <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
                  )}
                </div>
              </div>

              {/* 素材按产品线分布 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-4">素材产品线分布</h3>
                <div className="space-y-2.5">
                  {stats.materialsByLine.map((m) => {
                    const total = stats.materialsByLine.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round((m.count / total) * 100) : 0
                    return (
                      <div key={m.productLine}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 truncate max-w-[140px]">{m.productLine}</span>
                          <span className="font-medium text-slate-700 ml-2">{m.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {stats.materialsByLine.length === 0 && (
                    <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
