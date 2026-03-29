/**
 * POST /api/materials-lib/batch-save
 *
 * 批量保存素材（管理员审核确认标签后调用）。
 * 接收 FormData，每个文件附带 AI 确认后的标签元数据。
 *
 * FormData fields:
 *   files: File[]           — 图片文件（多个）
 *   metadata: string        — JSON string: Array<{
 *     fileName: string,
 *     productLine: string,
 *     productName: string,
 *     sceneType: string,
 *     tags: string,           // 逗号分隔的标签
 *     source: string,
 *   }>
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface ItemMeta {
  fileName: string
  productLine: string
  productName: string
  sceneType: string
  tags: string
  source: string
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const metadataStr = formData.get('metadata') as string
    if (!metadataStr) {
      return NextResponse.json({ error: '缺少 metadata' }, { status: 400 })
    }

    let metadata: ItemMeta[]
    try {
      metadata = JSON.parse(metadataStr)
    } catch {
      return NextResponse.json({ error: 'metadata 格式错误' }, { status: 400 })
    }

    // 获取所有上传的文件
    const files = formData.getAll('files').filter((v): v is File => v instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: '请提供至少一个文件' }, { status: 400 })
    }

    const results: Array<{ fileName: string; success: boolean; error?: string; id?: string }> = []

    for (const file of files) {
      // 找到对应的 metadata
      const meta = metadata.find(m => m.fileName === file.name)
      if (!meta) {
        results.push({ fileName: file.name, success: false, error: '未找到对应的元数据' })
        continue
      }

      // 校验文件
      if (file.size > MAX_FILE_SIZE) {
        results.push({ fileName: file.name, success: false, error: '文件过大' })
        continue
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        results.push({ fileName: file.name, success: false, error: '不支持的文件类型' })
        continue
      }

      // 不允许未分类素材入库
      if (meta.sceneType === '未分类') {
        results.push({ fileName: file.name, success: false, error: '未分类素材不能入库，请先手动标注' })
        continue
      }

      try {
        // 生成安全文件名
        const ext = path.extname(file.name).toLowerCase() || '.jpg'
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 确定保存路径
        const baseDir = meta.productLine === '品牌通用' ? 'ai-illustrations/brand' : 'materials'
        const saveDir = path
          .join(
            process.cwd(),
            'public',
            baseDir,
            meta.productLine === '品牌通用' ? '' : `${meta.productLine}/${meta.productName}`
          )
          .replace(/\/+$/, '')

        if (!existsSync(saveDir)) {
          await mkdir(saveDir, { recursive: true })
        }

        const filepath = path.join(saveDir, safeName)
        await writeFile(filepath, buffer)

        const webPath = meta.productLine === '品牌通用'
          ? `/ai-illustrations/brand/${safeName}`
          : `/materials/${meta.productLine}/${meta.productName}/${safeName}`

        const isFormula = meta.sceneType === '配方图'
        const isProduct = meta.sceneType === '产品图'

        const material = await prisma.material.create({
          data: {
            filename: safeName,
            filepath,
            webPath,
            productLine: meta.productLine,
            productName: meta.productName,
            sceneType: meta.sceneType,
            isFormula,
            isProduct,
            tags: meta.tags || '',
            sourceType: meta.source || 'upload',
          },
        })

        results.push({ fileName: file.name, success: true, id: material.id })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results.push({ fileName: file.name, success: false, error: message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount} 张保存成功${failCount > 0 ? `，${failCount} 张失败` : ''}`,
      results,
    })
  } catch (error) {
    console.error('Batch save error:', error)
    return NextResponse.json(
      { error: `批量保存失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
