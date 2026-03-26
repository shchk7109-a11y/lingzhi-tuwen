/**
 * 服务端 API 身份验证工具
 * 使用 HMAC 签名 Token，无需数据库或内存存储
 * Token 自身携带过期时间和签名，验证时只需重新计算签名比对
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from './prisma'

/** 管理员 Token 请求头名称 */
export const ADMIN_TOKEN_HEADER = 'x-admin-token'

/** Token 有效期：7 天 */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * 获取签名密钥
 * 优先使用环境变量，否则使用 DATABASE_URL 的哈希值作为密钥
 * 这样即使没有配置专门的 SECRET，也能有一个稳定的密钥
 */
function getSigningKey(): string {
  if (process.env.ADMIN_TOKEN_SECRET) return process.env.ADMIN_TOKEN_SECRET
  if (process.env.ADMIN_PASSWORD) return `lingzhi_admin_${process.env.ADMIN_PASSWORD}`
  // 使用 DATABASE_URL 作为 fallback 密钥源
  const dbUrl = process.env.DATABASE_URL || 'default-lingzhi-key'
  return `lingzhi_${createHmac('sha256', 'lingzhi-salt').update(dbUrl).digest('hex').substring(0, 16)}`
}

/**
 * 对数据进行 HMAC-SHA256 签名
 */
function sign(data: string): string {
  return createHmac('sha256', getSigningKey()).update(data).digest('hex')
}

/**
 * 颁发一个新的管理员 Token（自签名，无需存储）
 * Token 格式: adm_{timestamp}_{random}.{signature}
 */
export async function issueAdminToken(): Promise<string> {
  const expireAt = Date.now() + TOKEN_TTL_MS
  const nonce = Math.random().toString(36).slice(2)
  const payload = `${expireAt}_${nonce}`
  const signature = sign(payload)
  const token = `adm_${payload}.${signature}`
  console.log(`[AUTH] Token issued: ${token.substring(0, 20)}... (expires: ${new Date(expireAt).toISOString()})`)
  return token
}

/**
 * 验证 Token 是否有效（通过重新计算签名比对）
 * 无需查询数据库或内存
 */
export async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) {
    console.log('[AUTH] verifyAdminToken: no token provided')
    return false
  }

  try {
    // Token 格式: adm_{expireAt}_{nonce}.{signature}
    if (!token.startsWith('adm_')) {
      console.log('[AUTH] verifyAdminToken: invalid token format (no adm_ prefix)')
      return false
    }

    const withoutPrefix = token.substring(4) // 去掉 "adm_"
    const dotIndex = withoutPrefix.lastIndexOf('.')
    if (dotIndex === -1) {
      console.log('[AUTH] verifyAdminToken: invalid token format (no signature)')
      return false
    }

    const payload = withoutPrefix.substring(0, dotIndex)
    const signature = withoutPrefix.substring(dotIndex + 1)

    // 验证签名
    const expectedSignature = sign(payload)
    if (signature !== expectedSignature) {
      console.log('[AUTH] verifyAdminToken: signature mismatch')
      return false
    }

    // 验证过期时间
    const parts = payload.split('_')
    if (parts.length < 2) {
      console.log('[AUTH] verifyAdminToken: invalid payload format')
      return false
    }
    const expireAt = parseInt(parts[0], 10)
    if (isNaN(expireAt) || Date.now() > expireAt) {
      console.log('[AUTH] verifyAdminToken: token expired')
      return false
    }

    console.log('[AUTH] verifyAdminToken: valid')
    return true
  } catch (e) {
    console.error('[AUTH] verifyAdminToken error:', e)
    return false
  }
}

/**
 * 使 Token 失效（退出登录）
 * HMAC Token 无法真正"撤销"，但前端会清除存储
 * 如果需要强制失效，可以更改签名密钥
 */
export async function revokeAdminToken(token: string): Promise<void> {
  // HMAC Token 无需服务端撤销操作
  console.log('[AUTH] Token revoked (client-side only)')
}

/**
 * 从请求中提取 admin token
 */
export function extractToken(request: NextRequest): string | null {
  const headerToken = request.headers.get(ADMIN_TOKEN_HEADER)
  const cookieToken = request.cookies.get('admin_token')?.value
  const token = headerToken || cookieToken || null
  console.log(`[AUTH] extractToken: header=${headerToken ? 'yes' : 'no'}, cookie=${cookieToken ? 'yes' : 'no'}, result=${token ? 'found' : 'null'}`)
  return token
}

/**
 * 守卫函数：验证请求是否携带有效的管理员 Token
 * 如果验证失败，返回 401 响应；否则返回 null（表示通过）
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = extractToken(request)
  const valid = await verifyAdminToken(token)
  if (!valid) {
    console.log(`[AUTH] requireAdmin DENIED`)
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
