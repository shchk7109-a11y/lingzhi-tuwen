import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-client'
import { prisma } from '@/lib/prisma'

// 默认提示词（数据库不可用时的备用）
const DEFAULT_CLEAN_PROMPT = `你是一位顶级小红书文案专家，专精于"去AI化"和"提升真人感"，同时擅长根据用户画像进行个性化二次创作。

【AI味检测】
对原文进行8个维度的检测，给出严重程度评分（0=无问题，5=非常严重）：
1. 感叹号密度：>3个/100字 → 严重
2. 套路化开头：匹配"谁懂啊/家人们/绝了/救命/OMG/天哪/姐妹们" → 严重
3. 完美结构：连续3个以上✅/①②③/第一第二第三 → 严重
4. 空泛形容词："绝了/太棒了/完美/强烈推荐/必须入手"后无具体描述 → 中等
5. 过度正能量：全程无负面/犹豫/转折/小瑕疵 → 中等
6. 标签堆砌：标签数量≥6且格式整齐划一 → 轻微
7. 书面语过重：含"综上所述/由此可见/不仅如此/综合来看" → 中等
8. emoji滥用：每句都有emoji，密度过高 → 轻微

【清洗操作】
根据客户背景（职业/年龄/语言风格/生活场景/痛点）进行个性化改写：
- 保留原文的小红书风格（emoji、段落感、话题标签）
- 只替换AI味词汇，减少感叹号，加入1-2个具体细节
- 打破过于完美的结构，加入口语化过渡词
- 标签保留2-4个，选最贴合内容的
- 严禁出现功效词（补气、养血、祛湿、清脂等），改用感受/体验描述

【AI味词汇替换规则】
绝了→挺好的/还不错 | 太棒了→挺满意/超出预期 | 强烈推荐→可以试试/个人推荐 | 必须入手→可以考虑 | 完美→总体不错 | 救命→（去掉或换具体感受）| 家人们→（去掉或换"大家"）| 谁懂啊→（偶尔用，不是每篇都用）| 综上所述→（直接去掉）

【重要输出规则】
- 严格按JSON格式输出，不要有任何额外文字
- JSON字符串值中的换行符必须用\\n表示，不能直接换行

【输出JSON格式】
{
  "detection": [
    {"dimension": "感叹号密度", "rating": 0, "description": "描述"},
    {"dimension": "套路化开头", "rating": 0, "description": "描述"},
    {"dimension": "完美结构", "rating": 0, "description": "描述"},
    {"dimension": "空泛形容词", "rating": 0, "description": "描述"},
    {"dimension": "过度正能量", "rating": 0, "description": "描述"},
    {"dimension": "标签堆砌", "rating": 0, "description": "描述"},
    {"dimension": "书面语过重", "rating": 0, "description": "描述"},
    {"dimension": "emoji滥用", "rating": 0, "description": "描述"}
  ],
  "totalScore": 0,
  "cleanedText": "清洗后的完整文案（保留小红书风格，换行用\\n）",
  "explanation": "主要修改说明（1-2句话）",
  "checklist": {
    "likeFriendChat": true,
    "hasDetails": true,
    "hasEmotion": true,
    "hasColloquial": true,
    "hasRealFeel": true
  },
  "recommendedVersion": "light",
  "tags": ["话题标签1", "话题标签2", "话题标签3"]
}`

const DEFAULT_PYQ_PROMPT = `你是一位朋友圈营销专家，擅长撰写真实、有温度、重分享的社交文案。请对提供的文案进行去AI化清洗。

【朋友圈文案标准】
1. 真实感：像真人发的朋友圈，不要有太重的营销痕迹。
2. 侧重点：突出产品的功能、实际效果和口感描述。
3. 社交性：语气亲切，像是在给朋友安利好物。
4. 简洁性：不要太长，段落清晰，适当使用emoji增加亲和力。
5. 严禁词汇：去掉"绝了"、"家人们"、"谁懂啊"等过度的小红书风格词汇。
6. 严格删除冗余内容（必须完全删除，不能保留）：
   - 删除所有【配图建议】、【配图说明】、【配图】等配图相关的所有内容
   - 删除所有【发布时机】、【发布时间】、【发布】等发布相关的所有内容
   - 删除所有【使用场景】、【场景建议】、【场景】等场景相关的所有内容
   - 删除所有带【】括号的建议、提示或说明
   - 只保留纯净的核心文案内容，不能有任何【】括号的内容

7. 重要约束：
   - 输出的文案中绝对不能出现任何【】括号
   - 绝对不能出现配图建议、发布时机、场景等建议词汇

【输出JSON格式】
{
  "cleanedText": "清洗后的朋友圈文案",
  "explanation": "修改说明，重点描述了哪些功能或口感细节"
}`

/**
 * 修复AI返回的JSON字符串中的控制字符问题
 */
function fixJsonControlChars(jsonStr: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i]

    if (escaped) {
      result += ch
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      result += ch
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      result += ch
      continue
    }

    if (inString) {
      if (ch === '\n') {
        result += '\\n'
      } else if (ch === '\r') {
        result += '\\r'
      } else if (ch === '\t') {
        result += '\\t'
      } else if (ch.charCodeAt(0) < 32) {
        result += ' '
      } else {
        result += ch
      }
    } else {
      result += ch
    }
  }

  return result
}

/**
 * 安全解析JSON，失败时自动修复控制字符
 */
function safeParseJson(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr)
  } catch {
    try {
      return JSON.parse(fixJsonControlChars(jsonStr))
    } catch {
      try {
        const aggressiveFixed = jsonStr.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (match, content) => {
            const cleaned = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
            return `"${cleaned}"`
          }
        )
        return JSON.parse(aggressiveFixed)
      } catch (e) {
        throw e
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 先用json()解析，失败时降级到text()手动解析
    let content: string = ''
    let customerProfile: string = ''
    let platform: string = 'xhs'
    try {
      const body = await request.json()
      content = body.content || ''
      customerProfile = body.customerProfile || ''
      platform = body.platform || 'xhs'
    } catch {
      try {
        const rawText = await request.text()
        const fixed = fixJsonControlChars(rawText)
        const body = JSON.parse(fixed)
        content = body.content || ''
        customerProfile = body.customerProfile || ''
        platform = body.platform || 'xhs'
      } catch (parseErr) {
        console.error('Request body parse error:', parseErr)
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      }
    }

    // 清理文案内容中的特殊字符
    content = content
      .replace(/\uFEFF/g, '')
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ')
      .trim()

    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    // 从数据库读取最新提示词
    let systemPrompt = platform === 'pyq' ? DEFAULT_PYQ_PROMPT : DEFAULT_CLEAN_PROMPT
    const promptKey = platform === 'pyq' ? 'pyq_clean' : 'content_clean'
    
    try {
      const promptRecord = await prisma.prompt.findUnique({ where: { key: promptKey } })
      if (promptRecord?.content) {
        systemPrompt = promptRecord.content
      }
    } catch {
      // 数据库不可用时使用默认提示词
    }

    // 构建用户提示词
    let userPrompt = `【需要清洗的文案】\n${content}`
    if (customerProfile) {
      userPrompt += `\n\n【客户背景画像】\n${customerProfile}\n\n请严格根据客户背景调整文案风格、口吻、生活场景和细节。`
    }
    userPrompt += `\n\n请进行去AI化处理，严格按照JSON格式输出结果，不要有任何额外文字。注意：JSON字符串中的换行必须用\\n表示。`

    // 最多重试2次
    const MAX_RETRIES = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await callAI(userPrompt, systemPrompt)

        let jsonStr = result.content.trim()
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
        }
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }

        const parsed = safeParseJson(jsonStr)

        // 兼容逻辑
        if (!parsed.cleanedText && parsed.versions) {
          parsed.cleanedText = parsed.versions.light || parsed.versions.medium || content
        }
        if (!parsed.cleanedText) {
          parsed.cleanedText = content
        }

        // 朋友圈模式下，补全小红书模式所需的字段并强制删除冗余内容
        if (platform === 'pyq') {
          let cleanedText = parsed.cleanedText || ''
          // 1. 删除【】全角书名号内的配图建议等内容
          cleanedText = cleanedText.replace(/【配图[^】]*】[^\n]*/g, '')
          cleanedText = cleanedText.replace(/【发布[^】]*】[^\n]*/g, '')
          cleanedText = cleanedText.replace(/【[^】]*(建议|时机|时间|场景|说明|标签|话题)[^】]*】[^\n]*/g, '')
          cleanedText = cleanedText.replace(/【[^】]*】/g, '')
          // 2. 删除（配图：...）、(配图：...)、（配图建议：...）等圆括号形式（单行或多行）
          cleanedText = cleanedText.replace(/（配图[^）]*）/g, '')
          cleanedText = cleanedText.replace(/\(配图[^)]*\)/g, '')
          cleanedText = cleanedText.replace(/（[^）]*(配图|建议|发布时机|场景)[^）]*）/g, '')
          cleanedText = cleanedText.replace(/\([^)]*(配图|建议|发布时机|场景)[^)]*\)/g, '')
          // 3. 删除「配图建议：」「发布时机：」等无括号形式
          cleanedText = cleanedText.replace(/配图建议[：:][^\n]*/g, '')
          cleanedText = cleanedText.replace(/发布时机[：:][^\n]*/g, '')
          cleanedText = cleanedText.replace(/发布时间[：:][^\n]*/g, '')
          // 4. 删除末尾的 #话题标签 行
          cleanedText = cleanedText.replace(/\n#[^\n]+/g, '')
          // 5. 清理多余空行
          cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim()
          parsed.cleanedText = cleanedText
          
          parsed.detection = []
          parsed.totalScore = 0
          parsed.checklist = {
            likeFriendChat: true,
            hasDetails: true,
            hasEmotion: true,
            hasColloquial: true,
            hasRealFeel: true
          }
          parsed.tags = []
        }

        // 统一补全 versions 字段（兼容前端旧逻辑）
        if (!parsed.versions) {
          parsed.versions = {
            light: parsed.cleanedText,
            medium: parsed.cleanedText,
            heavy: parsed.cleanedText,
          }
        }

        if (!parsed.explanation) {
          parsed.explanation = { light: '', medium: '', heavy: '' }
        } else if (typeof parsed.explanation === 'string') {
          const exp = parsed.explanation
          parsed.explanation = { light: exp, medium: exp, heavy: exp }
        }

        if (!parsed.detection) {
          parsed.detection = []
        }

        if (typeof parsed.totalScore !== 'number') {
          parsed.totalScore = parsed.detection.reduce(
            (sum: number, d: { rating: number }) => sum + (d.rating || 0), 0
          )
        }

        if (!parsed.checklist) {
          parsed.checklist = {
            likeFriendChat: true,
            hasDetails: true,
            hasEmotion: true,
            hasColloquial: true,
            hasRealFeel: true,
          }
        }

        parsed.recommendedVersion = 'light'

        return NextResponse.json(parsed)

      } catch (err: any) {
        lastError = err
        console.error(`Clean error (attempt ${attempt + 1}/${MAX_RETRIES}):`, err.message)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // 所有重试失败，返回降级结果
    console.error('Clean failed after all retries, using fallback:', lastError?.message)
    return NextResponse.json({
      cleanedText: content,
      versions: { light: content, medium: content, heavy: content },
      explanation: { light: '清洗服务暂时不可用，已使用原文', medium: '', heavy: '' },
      detection: [],
      totalScore: 0,
      checklist: {
        likeFriendChat: false,
        hasDetails: false,
        hasEmotion: false,
        hasColloquial: false,
        hasRealFeel: false,
      },
      recommendedVersion: 'light',
      tags: [],
      _fallback: true,
    })

  } catch (error) {
    console.error('Clean request error:', error)
    return NextResponse.json({ error: 'Failed to clean content' }, { status: 500 })
  }
}
