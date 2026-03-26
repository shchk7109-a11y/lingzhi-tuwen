/**
 * 服务端 API 身份验证工具
 * Token 持久化到数据库 + 内存缓存双重保障
 * 解决数据库写入失败导致 Token 验证失败的问题
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

/** 管理员 Token 请求头名称 */
export const ADMIN_TOKEN_HEADER = 'x-admin-token'

/** Token 有效期：7 天 */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Setting 表中存 token 的 key 前缀 */
const TOKEN_KEY_PREFIX = 'admin_token:'

/**
 * 内存 Token 缓存（作为数据库的 fallback）
 * key: token 字符串, value: 过期时间戳
 */
const memoryTokenCache = new Map<string, number>()

/**
 * 清理过期的内存 Token
 */
function cleanExpiredTokens() {
  const now = Date.now()
  for (const [token, expireAt] of memoryTokenCache) {
    if (now > expireAt) {
      memoryTokenCache.delete(token)
    }
  }
}

/**
 * 颁发一个新的管理员 Token
 * 同时存入数据库和内存缓存，确保至少有一个能用
 */
export async function issueAdminToken(): Promise<string> {
  const token = `adm_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const expireAt = Date.now() + TOKEN_TTL_MS

  // 1. 先存入内存缓存（一定成功）
  memoryTokenCache.set(token, expireAt)
  cleanExpiredTokens()
  console.log(`[AUTH] Token issued and cached in memory: ${token.substring(0, 15)}...`)

  // 2. 尝试存入数据库（可能失败）
  try {
    await prisma.setting.upsert({
      where: { key: `${TOKEN_KEY_PREFIX}${token}` },
      create: { key: `${TOKEN_KEY_PREFIX}${token}`, value: String(expireAt) },
      update: { value: String(expireAt) },
    })
    console.log(`[AUTH] Token also saved to database`)
  } catch (e) {
    console.error('[AUTH] Failed to save token to database (will use memory cache):', e)
  }

  return token
}

/**
 * 验证 Token 是否有效
 * 先检查内存缓存，再检查数据库
 */
export async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) {
    console.log('[AUTH] verifyAdminToken: no token provided')
    return false
  }

  // 1. 先检查内存缓存
  const memoryExpire = memoryTokenCache.get(token)
  if (memoryExpire) {
    if (Date.now() <= memoryExpire) {
      console.log(`[AUTH] Token verified via memory cache: ${token.substring(0, 15)}...`)
      return true
    } else {
      memoryTokenCache.delete(token)
      console.log(`[AUTH] Token expired in memory cache: ${token.substring(0, 15)}...`)
    }
  }

  // 2. 再检查数据库
  try {
    const record = await prisma.setting.findUnique({
      where: { key: `${TOKEN_KEY_PREFIX}${token}` },
    })
    if (!record) {
      console.log(`[AUTH] Token not found in database: ${token.substring(0, 15)}...`)
      return false
    }
    const expireAt = parseInt(record.value, 10)
    if (Date.now() > expireAt) {
      await prisma.setting.delete({ where: { key: `${TOKEN_KEY_PREFIX}${token}` } }).catch(() => {})
      console.log(`[AUTH] Token expired in database: ${token.substring(0, 15)}...`)
      return false
    }
    // 数据库验证通过，同步到内存缓存
    memoryTokenCache.set(token, expireAt)
    console.log(`[AUTH] Token verified via database: ${token.substring(0, 15)}...`)
    return true
  } catch (e) {
    console.error('[AUTH] Database error during token verification:', e)
    return false
  }
}

/**
 * 使 Token 失效（退出登录）
 */
export async function revokeAdminToken(token: string): Promise<void> {
  memoryTokenCache.delete(token)
  try {
    await prisma.setting.delete({ where: { key: `${TOKEN_KEY_PREFIX}${token}` } })
  } catch { /* 忽略不存在的 token */ }
}

/**
 * 从请求中提取 admin token
 */
export function extractToken(request: NextRequest): string | null {
  const headerToken = request.headers.get(ADMIN_TOKEN_HEADER)
  const cookieToken = request.cookies.get('admin_token')?.value
  const token = headerToken || cookieToken || null
  console.log(`[AUTH] extractToken: header=${headerToken ? 'yes' : 'no'}, cookie=${cookieToken ? 'yes' : 'no'}, result=${token ? token.substring(0, 15) + '...' : 'null'}`)
  return token
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
    console.log(`[AUTH] requireAdmin DENIED for token: ${token ? token.substring(0, 15) + '...' : 'null'}`)
    return NextResponse.json(
      { error: '未授权，请先登录管理员账户' },
      { status: 401 }
    )
  }
  console.log(`[AUTH] requireAdmin ALLOWED`)
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
