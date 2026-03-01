import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-client'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// ============================================================
// 产品代码映射：根据文案内容推断产品代码
// ============================================================
const PRODUCT_CODE_MAP: Array<{ keywords: string[]; code: string; colorScheme: string }> = [
  { keywords: ['补气', '黄芪', '焕活', '补气焕活'], code: 'qi-tea', colorScheme: 'tea' },
  { keywords: ['湿祛', '轻畅', '祛湿', '湿祛轻畅'], code: 'shi-tea', colorScheme: 'mint' },
  { keywords: ['红颜', '透润', '玫瑰', '红颜透润'], code: 'yan-tea', colorScheme: 'rose' },
  { keywords: ['清脂', '纤纤', '清脂纤纤'], code: 'qing-zhi-tea', colorScheme: 'forest' },
  { keywords: ['悦活', '悦活草本'], code: 'yue-huo-coffee', colorScheme: 'herbal' },
  { keywords: ['悦纤', '悦轻', '悦纤草本', '悦轻草本'], code: 'yue-qing-coffee', colorScheme: 'herbal' },
  { keywords: ['悦颜', '悦颜草本'], code: 'yue-yan-coffee', colorScheme: 'coral' },
  { keywords: ['悦闲', '悦闲草本'], code: 'yue-xian-coffee', colorScheme: 'amber' },
  { keywords: ['咖啡', '美式', '草本咖啡'], code: 'yue-huo-coffee', colorScheme: 'herbal' },
]

// 场景关键词映射
const SCENE_MAP: Array<{ scene: string; keywords: string[] }> = [
  { scene: 'workplace', keywords: ['职场', '上班', '打工', '加班', '办公', '会议', '工作', '白领', '程序员'] },
  { scene: 'mom', keywords: ['宝妈', '妈妈', '孩子', '家庭', '哺乳', '备孕', '产后', '带娃'] },
  { scene: 'senior', keywords: ['中老年', '爸妈', '父母', '长辈', '银发', '老人', '养生'] },
  { scene: 'fitness', keywords: ['健身', '运动', '瑜伽', '跑步', '减脂', '塑形', '锻炼'] },
  { scene: 'morning', keywords: ['早晨', '早上', '早餐', '起床', '清晨', '早起'] },
  { scene: 'lounge', keywords: ['下午茶', '咖啡馆', '休闲', '放松', '周末', '悠闲'] },
  { scene: 'commute', keywords: ['通勤', '地铁', '上下班', '出行', '路上'] },
  { scene: 'outdoor', keywords: ['户外', '旅行', '爬山', '野餐', '公园'] },
  { scene: 'beauty', keywords: ['美容', '护肤', '美白', '养颜', '精致', '姐妹'] },
  { scene: 'gift', keywords: ['送礼', '礼物', '节日', '伴手礼', '孝顺'] },
  { scene: 'desk', keywords: ['桌面', '书桌', '电脑', '码字', '学习'] },
  { scene: 'garden', keywords: ['花园', '自然', '草本', '绿植', '古风', '茶道'] },
]

// 根据文案内容推断产品代码和场景
function inferProductAndScene(content: string, profile: string): { productCode: string; sceneCode: string; colorScheme: string } {
  const text = `${content} ${profile}`
  
  // 推断产品代码
  let productCode = 'qi-tea'
  let colorScheme = 'herbal'
  for (const item of PRODUCT_CODE_MAP) {
    if (item.keywords.some(kw => text.includes(kw))) {
      productCode = item.code
      colorScheme = item.colorScheme
      break
    }
  }
  
  // 推断场景
  let sceneCode = 'general'
  for (const item of SCENE_MAP) {
    if (item.keywords.some(kw => text.includes(kw))) {
      sceneCode = item.scene
      break
    }
  }
  
  return { productCode, sceneCode, colorScheme }
}

// 根据产品代码和场景选择插画URL，支持排除已用插画
function selectIllustrationUrl(productCode: string, sceneCode: string, excludeUrls: string[] = []): string {
  const illustrationsDir = path.join(process.cwd(), 'public', 'ai-illustrations')
  const productDir = path.join(illustrationsDir, productCode)

  // 获取该产品目录下所有可用插画
  function getAllProductIllustrations(): string[] {
    if (!fs.existsSync(productDir)) return []
    return fs.readdirSync(productDir)
      .filter(f => f.endsWith('.png'))
      .map(f => `/ai-illustrations/${productCode}/${f}`)
  }

  // 从候选列表中选出未被排除的（优先精确场景，其次随机）
  function pickUnused(candidates: string[]): string | null {
    const unused = candidates.filter(u => !excludeUrls.includes(u))
    if (unused.length > 0) {
      return unused[Math.floor(Math.random() * unused.length)]
    }
    // 全部用过了，随机选一张（允许重复）
    return candidates[Math.floor(Math.random() * candidates.length)] || null
  }

  const allProductIllustrations = getAllProductIllustrations()

  // 1. 优先尝试精确匹配场景（且未被排除）
  const exactUrl = `/ai-illustrations/${productCode}/${sceneCode}.png`
  if (fs.existsSync(path.join(productDir, `${sceneCode}.png`)) && !excludeUrls.includes(exactUrl)) {
    return exactUrl
  }

  // 2. 从产品目录所有插画中选未用的
  if (allProductIllustrations.length > 0) {
    const picked = pickUnused(allProductIllustrations)
    if (picked) return picked
  }

  // 3. 跨产品线兜底：同类型产品（咖啡/茶饮）的其他插画
  const isCoffee = productCode.includes('coffee')
  const siblingDirs = fs.readdirSync(illustrationsDir)
    .filter(d => {
      const full = path.join(illustrationsDir, d)
      return fs.statSync(full).isDirectory() &&
        d !== productCode &&
        d !== 'brand' &&
        (isCoffee ? d.includes('coffee') : d.includes('tea'))
    })
  const siblingUrls: string[] = []
  for (const dir of siblingDirs) {
    const files = fs.readdirSync(path.join(illustrationsDir, dir))
      .filter(f => f.endsWith('.png'))
      .map(f => `/ai-illustrations/${dir}/${f}`)
    siblingUrls.push(...files)
  }
  if (siblingUrls.length > 0) {
    const picked = pickUnused(siblingUrls)
    if (picked) return picked
  }

  // 4. 最终兜底
  const fallbacks = ['herbal-tea.png', 'herbal-coffee.png', 'qi-tea-general.png']
  for (const fb of fallbacks) {
    if (fs.existsSync(path.join(illustrationsDir, fb))) {
      return `/ai-illustrations/${fb}`
    }
  }
  return `/ai-illustrations/herbal-tea.png`
}

const coverSystemPrompt = `你是一位顶级小红书爆款内容策划师，专门制作具有强烈视觉冲击力的信息图封面。

【封面风格要求】
参考风格：奶油米白背景 + 水彩手绘插画风 + 自然草本配色
布局：竖版3:4比例，分为顶部标题区、中部主图区（插画）、底部信息图区

【标题要求】
- 主标题：8-15字，含感叹号，强情绪，可加引号强调关键词
- 公式选择：痛点+解决 / 数字+结果 / 反转惊喜 / 身份共鸣 / 悬念钩子
- 副标题：10-20字，补充说明，引导阅读
- 严禁出现功能性宣传词（如"补气""养血""祛湿"等），用感受/体验代替

【信息图区域要求】
左栏：2个痛点/问题信息块，每块含标题+图标+说明（用感受描述，不用功效词）
右栏：产品卖点区域，含亮点标题+三段式口感/体验描述+产品标签
对比表格：使用"以前的我 vs 现在的我"对比，3行，维度为日常感受

【JSON格式输出】
{
  "title": "主标题（8-15字，含感叹号，可含引号，不含功效词）",
  "subtitle": "副标题（10-20字）",
  "leftBlocks": [
    {
      "title": "痛点标题（4-8字，用感受词）",
      "icon": "相关emoji",
      "detail": "解决说明（8-15字，用体验描述）"
    },
    {
      "title": "痛点标题（4-8字）",
      "icon": "相关emoji",
      "detail": "解决说明（8-15字）"
    }
  ],
  "rightSection": {
    "highlightTitle": "右栏核心亮点（4-8字，体验感受）",
    "layers": [
      {"label": "第一层体验", "desc": "草本成分名", "emoji": "🌿"},
      {"label": "第二层体验", "desc": "草本成分名", "emoji": "🍄"},
      {"label": "第三层体验", "desc": "草本成分名", "emoji": "🌱"}
    ],
    "techPoint": "产品特色描述（6-12字）",
    "productName": "产品名称（4-8字）",
    "productSlogan": "体验1|体验2|体验3"
  },
  "compareTable": [
    {"dimension": "精力状态", "before": "以前的感受", "after": "现在的感受"},
    {"dimension": "身体感觉", "before": "以前的感受", "after": "现在的感受"},
    {"dimension": "日常状态", "before": "以前的感受", "after": "现在的感受"}
  ],
  "sourceNote": "真实用户体验分享",
  "tags": ["话题标签1", "话题标签2", "话题标签3", "话题标签4"]
}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, profile, excludeIllustrations } = body
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    // 推断产品和场景，选择插画（排除本批已用插画）
    const { productCode, sceneCode, colorScheme } = inferProductAndScene(content, profile || '')
    const illustrationUrl = selectIllustrationUrl(productCode, sceneCode, excludeIllustrations || [])

    const prompt = `【文案内容】\n${content}\n\n【作者/客户背景】\n${profile || '未提供'}\n\n请根据以上文案内容，提取并生成小红书信息图封面所需的结构化数据。\n要求：\n1. 标题要有爆款感，结合客户背景调整语气\n2. 信息块要提炼文案中的核心痛点和解决方案，用感受词而非功效词\n3. 对比表格使用"以前的我 vs 现在的我"语义，描述日常感受变化\n4. 严禁出现功能性宣传词（补气、养血、祛湿、清脂等）\n5. 严格按JSON格式输出，不要有多余文字`

    // 从数据库读取最新提示词（如有），否则使用默认
    let systemPrompt = coverSystemPrompt
    try {
      const promptRecord = await prisma.prompt.findUnique({ where: { key: 'cover_generate' } })
      if (promptRecord?.content) {
        systemPrompt = promptRecord.content
      }
    } catch {
      // 数据库不可用时使用默认提示词
    }
    const result = await callAI(prompt, systemPrompt)
    let jsonStr = result.content.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    }
    const parsed = JSON.parse(jsonStr)

    // 数据完整性补全
    if (!parsed.leftBlocks || parsed.leftBlocks.length < 2) {
      parsed.leftBlocks = [
        { title: '告别疲惫感', icon: '😮‍💨', detail: '不再昏昏沉沉，精力充沛一整天' },
        { title: '轻盈好状态', icon: '✨', detail: '身体轻盈，气色自然好看' }
      ]
    }
    if (!parsed.rightSection) {
      parsed.rightSection = {
        highlightTitle: '三重体验',
        layers: [
          { label: '入口清香', desc: '草本精华', emoji: '🌿' },
          { label: '回甘醇厚', desc: '天然成分', emoji: '🍄' },
          { label: '尾韵顺滑', desc: '精制工艺', emoji: '🌱' }
        ],
        techPoint: '传统工艺精制',
        productName: parsed.productName || '灵芝草本饮',
        productSlogan: parsed.productSlogan || '温润回甘|轻盈舒适|冲泡即饮'
      }
    }
    // 确保layers有emoji字段
    if (parsed.rightSection?.layers) {
      parsed.rightSection.layers = parsed.rightSection.layers.map((l: any, i: number) => ({
        ...l,
        emoji: l.emoji || ['🌿', '🍄', '🌱'][i] || '🌿'
      }))
    }
    if (!parsed.compareTable || parsed.compareTable.length < 3) {
      parsed.compareTable = [
        { dimension: '精力状态', before: '总是疲惫', after: '精力充沛' },
        { dimension: '身体感觉', before: '沉重不适', after: '轻盈舒畅' },
        { dimension: '日常状态', before: '状态不佳', after: '神采奕奕' }
      ]
    }
    if (!parsed.tags || parsed.tags.length === 0) {
      parsed.tags = ['灵芝水铺', '草本养生', '健康生活']
    }

    // 添加V3所需字段
    parsed.illustrationUrl = illustrationUrl
    parsed.colorScheme = colorScheme
    parsed.layout = 'minimal'  // 默认极简大图布局
    parsed.productCode = productCode

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Cover generation error:', error)
    return NextResponse.json({ error: 'Failed to generate cover' }, { status: 500 })
  }
}
