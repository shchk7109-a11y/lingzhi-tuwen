import { NextRequest, NextResponse } from 'next/server'
import { getAdminPassword, issueAdminToken, revokeAdminToken, extractToken } from '@/lib/server-auth'
import { checkRateLimit } from '@/lib/rate-limit'

/** POST /api/auth/admin — 管理员登录，返回 Token */
export async function POST(request: NextRequest) {
  // 速率限制：每个 IP 每分钟最多尝试 5 次
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rl = checkRateLimit(`auth:${ip}`, { windowMs: 60_000, max: 5 })
  if (!rl.success) {
    return NextResponse.json(
      { error: '尝试次数过多，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const { password } = await request.json()
    if (!password) return NextResponse.json({ error: '请输入密码' }, { status: 400 })

    const adminPassword = await getAdminPassword()
    if (password !== adminPassword) {
      return NextResponse.json({ error: '密码错误，请重试' }, { status: 401 })
    }

    // 颁发 Token
    const token = await issueAdminToken()
    const response = NextResponse.json({ success: true, token })
    // 同时写入 HttpOnly Cookie，防止 XSS 读取
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (error) {
    return NextResponse.json({ error: '认证失败' }, { status: 500 })
  }
}

/** DELETE /api/auth/admin — 退出登录，使 Token 失效 */
export async function DELETE(request: NextRequest) {
  const token = extractToken(request)
  if (token) await revokeAdminToken(token)
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_token')
  return response
}
