'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AdminLoginModal from './AdminLoginModal'

const PUBLIC_LINKS = [
  { href: '/', label: '内容处理', icon: '🎯' },
  { href: '/history', label: '处理结果', icon: '📋' },
]

const ADMIN_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/customers', label: '客户管理', icon: '👥' },
  { href: '/materials', label: '素材库', icon: '🖼️' },
  { href: '/prompts', label: '提示词', icon: '✍️' },
  { href: '/settings', label: '设置', icon: '⚙️' },
]

export default function NavBar() {
  const pathname = usePathname()
  const { isAdmin, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="bg-[#1E4D2B] border-b-2 border-[#2D6B3E] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#A8D5C2] rounded-lg flex items-center justify-center text-lg">🌿</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">灵芝水铺</h1>
              <p className="text-[#A8D5C2] text-xs leading-tight">图文优化系统</p>
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex items-center gap-1">
            {/* 公开导航 */}
            {PUBLIC_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {/* 分隔线 */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* 管理员导航 */}
            {isAdmin ? (
              <>
                {ADMIN_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isActive(link.href)
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-yellow-300/80 hover:text-yellow-300 rounded-lg hover:bg-white/10 ml-1"
                  title="退出管理员模式"
                >
                  <span>🔓</span>
                  <span>退出</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all"
                title="管理员登录"
              >
                <span>🔐</span>
                <span className="text-xs">管理员</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  )
}
