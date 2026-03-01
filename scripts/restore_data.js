const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('开始恢复基础数据...');

  // 1. 恢复提示词
  const prompts = [
    {
      key: 'content_clean',
      name: '文案去AI化二创（v2.0）',
      description: '深度集成8维度AI味检测+三档清洗版本+人工感评分，基于客户画像个性化改写',
      category: 'content',
      content: `你是一位顶级小红书文案专家，专精于去AI化和提升真人感，同时擅长根据用户画像进行个性化二次创作。

【第一步：AI味检测】
对原文进行8个维度的检测，给出严重程度评分（0=无问题，5=非常严重）：
1. 感叹号密度：>3个/100字 → 严重
2. 套路化开头：匹配谁懂啊/家人们/绝了/救命/OMG/天哪/姐妹们 → 严重
3. 完美结构：连续3个以上✅/①②③/第一第二第三 → 严重
4. 空泛形容词：绝了/太棒了/完美/强烈推荐/必须入手后无具体描述 → 中等
5. 过度正能量：全程无负面/犹豫/转折/小瑕疵 → 中等
6. 标签堆砌：标签数量≥6且格式整齐划一 → 轻微
7. 书面语过重：含综上所述/由此可见/不仅如此/综合来看 → 中等
8. emoji滥用：每句都有emoji，密度过高 → 轻微

【第二步：三档清洗操作】
根据客户背景（职业/年龄/语言风格/生活场景/痛点）进行个性化改写：

版本1（轻度清洗）：保留原结构，只替换AI味词汇，减少感叹号，加入1-2个具体细节
版本2（中度清洗）【推荐】：打破完美结构，改用口语化过渡词（然后/不过/其实/说实话），加入时间/数字/具体感受，加入小瑕疵或犹豫，标签减至2-3个
版本3（重度清洗）：完全重写，以客户真实生活场景切入，像朋友聊天一样自然，无分点结构，有来有往，有真实波动

【AI味词汇替换规则】
绝了→挺好的/还不错 | 太棒了→挺满意/超出预期 | 强烈推荐→可以试试/个人推荐 | 必须入手→可以考虑 | 完美→总体不错 | 救命→（去掉或换具体感受）| 家人们→（去掉或换大家）| 谁懂啊→（偶尔用，不是每篇都用）| 综上所述→（直接去掉）

【人工感检查标准】
清洗后文案需满足：①像朋友聊天（有来有往）②有具体细节（时间/数字/感受）③有小情绪（不总正能量）④有口语化过渡词 ⑤有真实感（不完美，有小瑕疵）

【输出JSON格式】（严格按此格式，不要有任何额外文字）
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
  "cleanedText": "轻度清洗后的完整文案",
  "versions": {
    "light": "轻度清洗后的完整文案",
    "medium": "中度清洗后的完整文案",
    "heavy": "重度清洗后的完整文案"
  },
  "explanation": {
    "light": "修改说明...",
    "medium": "修改说明...",
    "heavy": "修改说明..."
  },
  "checklist": {
    "likeFriendChat": true,
    "hasDetails": true,
    "hasEmotion": true,
    "hasColloquial": true,
    "hasRealFeel": true
  },
  "recommendedVersion": "light",
  "tags": ["推荐话题标签1", "推荐话题标签2"]
}`
    },
    {
      key: 'cover_generate',
      name: '封面视觉策划',
      description: '根据文案内容策划封面标题、插画场景和配色方案',
      category: 'cover',
      content: `你是一位顶级小红书视觉策划师。请根据提供的文案内容，策划封面的视觉方案。输出JSON格式。`
    }
  ];

  for (const p of prompts) {
    await prisma.prompt.upsert({
      where: { key: p.key },
      update: p,
      create: p,
    });
  }
  console.log('提示词恢复完成');

  // 2. 扫描并恢复素材
  const materialsDir = path.join(process.cwd(), 'public', 'materials');
  if (fs.existsSync(materialsDir)) {
    const productLines = fs.readdirSync(materialsDir);
    for (const pl of productLines) {
      const plPath = path.join(materialsDir, pl);
      if (fs.statSync(plPath).isDirectory()) {
        const productNames = fs.readdirSync(plPath);
        for (const pn of productNames) {
          const pnPath = path.join(plPath, pn);
          if (fs.statSync(pnPath).isDirectory()) {
            const files = fs.readdirSync(pnPath);
            for (const f of files) {
              if (f.match(/\.(jpg|jpeg|png|webp)$/i)) {
                const webPath = `/materials/${pl}/${pn}/${f}`;
                const isFormula = f.includes('配方') || f.includes('成分');
                const isProduct = f.includes('产品') || f.includes('包装');
                await prisma.material.create({
                  data: {
                    filename: f,
                    filepath: path.join(pnPath, f),
                    webPath,
                    productLine: pl,
                    productName: pn,
                    sceneType: isFormula ? '配方图' : (isProduct ? '产品图' : '场景图'),
                    isFormula,
                    isProduct,
                  }
                });
              }
            }
          }
        }
      }
    }
  }
  console.log('素材恢复完成');

  // 3. 恢复基础客户
  const sampleCustomers = [
    { name: '老武太极养生', category: '银发康养型', occupation: '太极教练', city: '成都' },
    { name: '小陈不加班', category: '职场精英型', occupation: '程序员', city: '深圳' },
    { name: 'Alex养生日记', category: '精致生活型', occupation: '博主', city: '上海' },
  ];
  for (const c of sampleCustomers) {
    await prisma.customer.create({ data: c });
  }
  console.log('客户数据恢复完成');
}

main().catch(console.error).finally(() => prisma.$disconnect());
