import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { requireAdmin } from '@/lib/server-auth'
import { checkRateLimit } from '@/lib/rate-limit'

/** 允许上传的图片 MIME 类型白名单 */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
/** 允许的文件扩展名白名单 */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
/** 单文件最大大小：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productLine = searchParams.get('productLine')
    const productName = searchParams.get('productName')
    const sceneType = searchParams.get('sceneType')
    const search = searchParams.get('search')

    const where: any = {}
    if (productLine && productLine !== 'all') where.productLine = productLine
    if (productName && productName !== 'all') where.productName = productName
    if (sceneType && sceneType !== 'all') where.sceneType = sceneType
    if (search) {
      where.OR = [
        { filename: { contains: search } },
        { productName: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ productLine: 'asc' }, { productName: 'asc' }, { sceneType: 'asc' }],
    })

    // 统计信息
    const stats = await prisma.material.groupBy({
      by: ['productLine', 'sceneType'],
      _count: { _all: true },
    })

    return NextResponse.json({ materials, stats })
  } catch (error) {
    console.error('Materials GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 管理员权限验证
  const authError = await requireAdmin(request)
  if (authError) return authError

  // 上传速率限制：每分钟最多 30 次
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`upload:${ip}`, { windowMs: 60_000, max: 30 })
  if (!rl.success) {
    return NextResponse.json({ error: '上传过于频繁，请稍后再试' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productLine = formData.get('productLine') as string || '草本茶饮'
    const productName = formData.get('productName') as string || '通用'
    const sceneType = formData.get('sceneType') as string || '场景图'
    const tags = formData.get('tags') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ===== 服务端文件安全校验 =====
    // 1. 文件大小校验
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }
    // 2. MIME 类型校验
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${file.type}，仅允许 JPG/PNG/WebP/GIF` },
        { status: 400 }
      )
    }
    // 3. 文件扩展名校验
    const originalExt = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(originalExt)) {
      return NextResponse.json(
        { error: `不支持的文件扩展名: ${originalExt}` },
        { status: 400 }
      )
    }
    // ===== 校验结束 =====

    // 使用时间戳+随机数重命名文件，防止路径遍历攻击
    const safeBaseName = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const filename = `${safeBaseName}${originalExt}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 封面插画保存到 ai-illustrations 目录，其他素材保存到 materials 目录
    const baseDir = productLine === '品牌通用' ? 'ai-illustrations/brand' : 'materials'
    const saveDir = path
      .join(
        process.cwd(),
        'public',
        baseDir,
        productLine === '品牌通用' ? '' : `${productLine}/${productName}`
      )
      .replace(/\/+$/, '')

    if (!existsSync(saveDir)) {
      await mkdir(saveDir, { recursive: true })
    }

    const filepath = path.join(saveDir, filename)
    await writeFile(filepath, buffer)

    const webPath =
      productLine === '品牌通用'
        ? `/ai-illustrations/brand/${filename}`
        : `/materials/${productLine}/${productName}/${filename}`

    const isFormula = sceneType === '配方图'
    const isProduct = sceneType === '产品图'

    const material = await prisma.material.create({
      data: { filename, filepath, webPath, productLine, productName, sceneType, isFormula, isProduct, tags },
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Materials POST error:', error)
    return NextResponse.json({ error: 'Failed to upload material' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, tags, sceneType } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (tags !== undefined) updateData.tags = tags
    if (sceneType !== undefined) {
      updateData.sceneType = sceneType
      updateData.isFormula = sceneType === '配方图'
      updateData.isProduct = sceneType === '产品图'
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(material)
  } catch (error) {
    console.error('Materials PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const material = await prisma.material.findUnique({ where: { id } })
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 删除物理文件
    try {
      if (existsSync(material.filepath)) {
        await unlink(material.filepath)
      }
    } catch (e) {
      console.warn('File delete failed:', e)
    }

    await prisma.material.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}
