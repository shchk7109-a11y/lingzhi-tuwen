import { NextRequest, NextResponse } from 'next/server'
import { setApiKey, setModel, getSettings } from '@/lib/ai-client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'
import type { AIModel } from '@/lib/ai-client'

export async function GET() {
  try {
    const settings = await getSettings()
    // 获取管理员密码（脱敏）
    const adminPwdSetting = await prisma.setting.findUnique({ where: { key: 'admin_password' } })
    const hasAdminPassword = !!adminPwdSetting?.value || !!process.env.ADMIN_PASSWORD

    return NextResponse.json({
      apiKey: settings.apiKey ? `${settings.apiKey.substring(0, 8)}...` : null,
      hasApiKey: !!settings.apiKey,
      model: settings.model,
      hasAdminPassword,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 修改设置需要管理员权限
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { apiKey, model, adminPassword, newAdminPassword } = body

    // 修改管理员密码
    if (newAdminPassword !== undefined) {
      // 验证当前密码
      const currentPwdSetting = await prisma.setting.findUnique({ where: { key: 'admin_password' } })
      // 优先使用环境变量中的密码，其次数据库，最后使用环境变量默认值（不再硬编码）
      const currentPwd = process.env.ADMIN_PASSWORD || currentPwdSetting?.value || process.env.DEFAULT_ADMIN_PASSWORD || 'changeme'
      if (adminPassword !== currentPwd) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 401 })
      }
      if (!newAdminPassword || newAdminPassword.length < 6) {
        return NextResponse.json({ error: '新密码至少6位' }, { status: 400 })
      }
      await prisma.setting.upsert({
        where: { key: 'admin_password' },
        update: { value: newAdminPassword },
        create: { key: 'admin_password', value: newAdminPassword },
      })
      return NextResponse.json({ success: true, message: '管理员密码已更新' })
    }

    // 保存 API Key（放宽格式校验，只检查非空和最短长度）
    if (apiKey && apiKey.trim()) {
      const trimmedKey = apiKey.trim()
      if (trimmedKey.length < 10) {
        return NextResponse.json({ error: 'API Key 太短，请检查是否完整' }, { status: 400 })
      }
      await setApiKey(trimmedKey)
    }

    // 保存模型（即使没有 apiKey 也可以单独保存模型）
    if (model && ['deepseek', 'kimi', 'gemini'].includes(model)) {
      await setModel(model as AIModel)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
