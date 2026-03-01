/**
 * 服务端 API 身份验证工具
 * Token 持久化到数据库，解决热更新后内存 Token 丢失的问题
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

/** 管理员 Token 请求头名称 */
export const ADMIN_TOKEN_HEADER = 'x-admin-token'

/** Token 有效期：7 天（开发调试友好） */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Setting 表中存 token 的 key 前缀 */
const TOKEN_KEY_PREFIX = 'admin_token:'

/**
 * 颁发一个新的管理员 Token，存入数据库
 */
export async function issueAdminToken(): Promise<string> {
  const token = `adm_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const expireAt = Date.now() + TOKEN_TTL_MS
  try {
    await prisma.setting.upsert({
      where: { key: `${TOKEN_KEY_PREFIX}${token}` },
      create: { key: `${TOKEN_KEY_PREFIX}${token}`, value: String(expireAt) },
      update: { value: String(expireAt) },
    })
  } catch (e) {
    console.error('issueAdminToken DB error:', e)
  }
  return token
}

/**
 * 验证 Token 是否有效（从数据库查询）
 */
export async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false
  try {
    const record = await prisma.setting.findUnique({
      where: { key: `${TOKEN_KEY_PREFIX}${token}` },
    })
    if (!record) return false
    const expireAt = parseInt(record.value, 10)
    if (Date.now() > expireAt) {
      await prisma.setting.delete({ where: { key: `${TOKEN_KEY_PREFIX}${token}` } }).catch(() => {})
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * 使 Token 失效（退出登录）
 */
export async function revokeAdminToken(token: string): Promise<void> {
  try {
    await prisma.setting.delete({ where: { key: `${TOKEN_KEY_PREFIX}${token}` } })
  } catch { /* 忽略不存在的 token */ }
}

/**
 * 从请求中提取 admin token
 */
export function extractToken(request: NextRequest): string | null {
  return (
    request.headers.get(ADMIN_TOKEN_HEADER) ||
    request.cookies.get('admin_token')?.value ||
    null
  )
}

/**
 * 守卫函数：验证请求是否携带有效的管理员 Token（异步版）
 * 如果验证失败，返回 401 响应；否则返回 null（表示通过）
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = extractToken(request)
  const valid = await verifyAdminToken(token)
  if (!valid) {
    return NextResponse.json(
      { error: '未授权，请先登录管理员账户' },
      { status: 401 }
    )
  }
  return null
}

/**
 * 获取管理员密码（从数据库或环境变量）
 */
export async function getAdminPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'admin_password' },
    })
    if (setting?.value) return setting.value
  } catch { /* 数据库不可用 */ }
  return process.env.DEFAULT_ADMIN_PASSWORD || 'changeme'
}
