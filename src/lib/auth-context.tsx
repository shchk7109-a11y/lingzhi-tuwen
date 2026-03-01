'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const ADMIN_TOKEN_HEADER = 'x-admin-token'
const TOKEN_STORAGE_KEY = 'admin_token_v2'

interface AuthContextType {
  isAdmin: boolean
  adminToken: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  /** 返回带有管理员 Token 的请求头，用于需要权限的 API 调用 */
  authHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  adminToken: null,
  login: async () => false,
  logout: () => {},
  authHeaders: () => ({}),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  useEffect(() => {
    // 从 sessionStorage 恢复 Token
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      setIsAdmin(true)
      setAdminToken(token)
    }
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        const token: string = data.token || ''
        setIsAdmin(true)
        setAdminToken(token)
        // 存入 sessionStorage（浏览器关闭后自动清除）
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      // 通知服务端使 Token 失效
      await fetch('/api/auth/admin', {
        method: 'DELETE',
        headers: { [ADMIN_TOKEN_HEADER]: token },
      }).catch(() => {})
    }
    setIsAdmin(false)
    setAdminToken(null)
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [])

  const authHeaders = useCallback((): Record<string, string> => {
    const token = adminToken || sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return {}
    return { [ADMIN_TOKEN_HEADER]: token }
  }, [adminToken])

  return (
    <AuthContext.Provider value={{ isAdmin, adminToken, login, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
