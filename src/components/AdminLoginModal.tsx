'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface AdminLoginModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const success = await login(password)
      if (success) {
        onSuccess?.()
        onClose()
      } else {
        setError('密码错误，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-xl font-bold text-gray-900">管理员验证</h2>
            <p className="text-sm text-gray-500 mt-1">此功能仅管理员可访问</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">管理员密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            {error && (
              <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                取消
              </button>
              <button type="submit" disabled={loading || !password}
                className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
                {loading ? '验证中...' : '进入管理'}
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            请使用管理员密码登录（可在设置中修改）
          </p>
        </div>
      </div>
    </div>
  )
}
