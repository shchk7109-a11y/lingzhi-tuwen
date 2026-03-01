import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 关键词到场景标签的映射
const SCENE_KEYWORDS: Record<string, string[]> = {
  '职场': ['职场', '办公', '加班', '会议', '工作', '上班', '打工', '程序员', '运营', '设计师', '白领', '商务'],
  '运动': ['运动', '健身', '瑜伽', '跑步', '锻炼', '训练', '减脂', '塑形'],
  '家庭': ['宝妈', '妈妈', '家庭', '孩子', '早餐', '家里', '哺乳', '备孕'],
  '休闲': ['下午茶', '咖啡馆', '阅读', '休闲', '放松', '悠闲', '周末'],
  '熬夜': ['熬夜', '深夜', '失眠', '加班', '夜晚', '凌晨', '睡眠'],
  '自然': ['自然', '草本', '古风', '茶道', '森林', '养生', '中医'],
  '女性': ['女性', '女生', '美容', '护肤', '玫瑰', '精致', '姐妹'],
  '户外': ['户外', '通勤', '街头', '旅行', '出行'],
}

// 文案关键词 → 数据库中精准产品名的映射
const PRODUCT_NAME_KEYWORDS: Record<string, string[]> = {
  '清脂纤纤草本茶饮': ['清脂纤纤', '纤纤茶', '清脂茶', '清脂纤纤茶'],
  '红颜透润草本茶饮': ['红颜透润', '红颜茶', '透润茶'],
  '湿祛轻畅草本茶饮': ['湿祛轻畅', '祛湿茶', '轻畅茶', '湿祛'],
  '补气焕活草本茶饮': ['补气焕活', '补气茶', '焕活茶'],
  '悦活草本美式': ['悦活', '悦活咖啡', '悦活美式'],
  '悦纤草本美式': ['悦纤', '悦纤咖啡', '悦纤美式'],
  '悦轻草本美式': ['悦轻', '悦轻咖啡', '悦轻美式'],
  '悦颜草本美式': ['悦颜', '悦颜咖啡', '悦颜美式'],
}

function extractSceneTags(text: string): string[] {
  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(SCENE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) tags.push(tag)
  }
  return tags
}

/** 从文案中提取精准产品名（返回数据库中的完整 productName 字段值） */
function extractProductName(text: string): string | null {
  for (const [productName, keywords] of Object.entries(PRODUCT_NAME_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return productName
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const {
      cleanedContent,
      originalContent,
      customerBackground,
      productLine,
      productName: clientProductName,
      excludeIds,
      platform,
    } = await request.json()

    const usedIds: string[] = Array.isArray(excludeIds) ? excludeIds : []
    console.log('[match] excludeIds received:', usedIds.length, usedIds.map(id => id.substring(0, 8)))

    // 将原始文案也加入匹配范围，确保产品名能被提取
    const combinedText = `${originalContent || ''} ${cleanedContent || ''} ${customerBackground || ''}`
    const sceneTags = extractSceneTags(combinedText)

    // 精准产品名：客户端传入 > 从原始文案提取 > 从清洗后文案提取 > null（降级到产品线）
    const detectedProductName: string | null = clientProductName
      || extractProductName(originalContent || '')
      || extractProductName(cleanedContent || '')

    // 辅助：从候选列表中优先选未用过的，全用完则允许重复
    // rotate=true 启用轮换模式：按 ID 字母顺序排序，取第一个未用过的
    const pickUnused = (list: any[], currentUsedIds: string[], rotate = false): any | null => {
      if (list.length === 0) return null
      const unused = list.filter(m => !currentUsedIds.includes(m.id))
      if (unused.length > 0) {
        if (rotate) {
          const sorted = [...unused].sort((a, b) => a.id.localeCompare(b.id))
          return sorted[0]
        }
        return unused[Math.floor(Math.random() * unused.length)]
      }
      // 全部用完时：轮换模式下按顺序重新开始，随机模式下随机选
      if (rotate) {
        const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id))
        const lastUsedIdx = sorted.findLastIndex(m => currentUsedIds.includes(m.id))
        return sorted[(lastUsedIdx + 1) % sorted.length]
      }
      return list[Math.floor(Math.random() * list.length)]
    }

    /** 按优先级查询：精准产品名(模糊) → 通用素材 → 产品线 → 全库 */
    const findMaterials = async (base: Record<string, any>): Promise<any[]> => {
      if (detectedProductName) {
        const exactList = await prisma.material.findMany({ where: { ...base, productName: detectedProductName } })
        if (exactList.length > 0) return exactList
        const fuzzyList = await prisma.material.findMany({ where: { ...base, productName: { contains: detectedProductName } } })
        if (fuzzyList.length > 0) return fuzzyList
        const allProducts = await prisma.material.findMany({ where: base, select: { productName: true }, distinct: ['productName'] })
        const shortMatch = allProducts.find(p => p.productName && detectedProductName.includes(p.productName) && p.productName !== '通用')
        if (shortMatch) {
          const shortList = await prisma.material.findMany({ where: { ...base, productName: shortMatch.productName } })
          if (shortList.length > 0) return shortList
        }
      }
      if (!detectedProductName) {
        const genericList = await prisma.material.findMany({ where: { ...base, productName: '通用' } })
        if (genericList.length > 0) return genericList
      }
      if (productLine) {
        const list = await prisma.material.findMany({ where: { ...base, productLine } })
        if (list.length > 0) return list
      }
      return prisma.material.findMany({ where: base })
    }

    const currentBatchUsedIds = [...usedIds]

    // ─── 1. 配方图（降级：配方图 → 产品图 → 任意图）────────────────────────
    let formulaImage = null
    const formulaCandidates = await findMaterials({ isFormula: true })
    formulaImage = pickUnused(formulaCandidates, currentBatchUsedIds)
    if (!formulaImage) {
      const productCandidates = await findMaterials({ isProduct: true })
      formulaImage = pickUnused(productCandidates, currentBatchUsedIds)
    }
    if (!formulaImage) {
      const anyCandidates = await findMaterials({})
      formulaImage = pickUnused(anyCandidates, currentBatchUsedIds)
    }
    if (formulaImage) currentBatchUsedIds.push(formulaImage.id)

    // ─── 2. 场景图 1（标签匹配 → 任意场景图）────────────────────────────────
    let sceneImage1 = null
    if (sceneTags.length > 0) {
      // 先精准产品+标签，只取未用过的（不循环重用，全用完后降级到无标签场景图）
      const tagFilter = { isFormula: false, isProduct: false, OR: sceneTags.map(tag => ({ tags: { contains: tag } })) }
      const tagCandidates = await findMaterials(tagFilter)
      const unusedTagCandidates = tagCandidates.filter(m => !currentBatchUsedIds.includes(m.id))
      if (unusedTagCandidates.length > 0) {
        const sorted = [...unusedTagCandidates].sort((a, b) => a.id.localeCompare(b.id))
        sceneImage1 = sorted[0]
      }
    }
    if (!sceneImage1) {
      // 标签匹配全用完或无标签，降级到所有场景图轮换
      const sceneCandidates = await findMaterials({ isFormula: false, isProduct: false })
      sceneImage1 = pickUnused(sceneCandidates, currentBatchUsedIds, true)
    }
    if (sceneImage1) currentBatchUsedIds.push(sceneImage1.id)

    // ─── 3. 场景图 2（朋友圈模式）──────────────────────────────────────────────
    let sceneImage2 = null
    if (platform === 'pyq') {
      // 有精准产品名时：优先选同产品的产品图(isProduct=true)，没有则用同产品场景图，不跨产品
      if (detectedProductName) {
        // 先尝试同产品的产品图（轮换模式）
        const sameProductImgCandidates = await findMaterials({ isProduct: true })
        // 只保留与 detectedProductName 匹配的（模糊匹配）
        const strictProductImgs = sameProductImgCandidates.filter(m =>
          m.productName === detectedProductName ||
          m.productName?.includes(detectedProductName) ||
          detectedProductName.includes(m.productName)
        )
        // 只在有未用过的产品图时才选产品图，否则降级到场景图（避免重复）
        const unusedProductImgs = strictProductImgs.filter(m => !currentBatchUsedIds.includes(m.id))
        if (unusedProductImgs.length > 0) {
          const sorted = [...unusedProductImgs].sort((a, b) => a.id.localeCompare(b.id))
          sceneImage2 = sorted[0]
        }
        // 产品图已全部用完（或无产品图），降级到同产品场景图轮换
        if (!sceneImage2) {
          const sameProductScene = await findMaterials({ isFormula: false, isProduct: false })
          const strictScene = sameProductScene.filter(m =>
            m.productName === detectedProductName ||
            m.productName?.includes(detectedProductName) ||
            detectedProductName.includes(m.productName)
          )
          sceneImage2 = pickUnused(strictScene, currentBatchUsedIds, true)
        }
      } else {
        // 无精准产品名：按产品线选产品图，再降级到场景图（轮换模式）
        const productSceneCandidates = await findMaterials({ isProduct: true })
        sceneImage2 = pickUnused(productSceneCandidates, currentBatchUsedIds, true)
        if (!sceneImage2) {
          const fallbackScene = await findMaterials({ isFormula: false, isProduct: false })
          sceneImage2 = pickUnused(fallbackScene, currentBatchUsedIds, true)
        }
      }
      if (sceneImage2) currentBatchUsedIds.push(sceneImage2.id)
    }

    // ─── 4. 封面叠加图（小红书模式）────────────────────────────────────────
    let productImage = null
    if (platform !== 'pyq') {
      const brewingCandidates = await findMaterials({ sceneType: '冲泡图' })
      productImage = pickUnused(brewingCandidates, currentBatchUsedIds)
      if (!productImage) {
        const productImgCandidates = await findMaterials({ sceneType: '产品图' })
        productImage = pickUnused(productImgCandidates, currentBatchUsedIds)
      }
      if (productImage) currentBatchUsedIds.push(productImage.id)
    }

    // 返回本次实际选出的所有图的 ID（不过滤已在 excludeIds 中的）
    // 这样外部可以正确累积 excludeIds，确保轮换生效
    const selectedIds = [formulaImage, sceneImage1, sceneImage2, productImage]
      .filter(Boolean)
      .map((m: any) => m.id)

    console.log('[match] selected:', {
      formula: formulaImage?.id?.substring(0, 8),
      scene1: sceneImage1?.id?.substring(0, 8),
      scene2: sceneImage2?.id?.substring(0, 8),
      product: productImage?.id?.substring(0, 8),
      detectedProductName
    })

    return NextResponse.json({
      formulaImage,
      sceneImage1,
      sceneImage2,
      productImage,
      matchedTags: sceneTags,
      detectedProductName,
      usedIds: selectedIds,
    })
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Failed to match materials' }, { status: 500 })
  }
}
