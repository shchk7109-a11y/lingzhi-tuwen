const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('添加朋友圈清洗提示词...');

  const pyqPrompt = {
    key: 'pyq_clean',
    name: '朋友圈文案去AI化清洗',
    description: '侧重功能、效果、口感描述，符合朋友圈社交分享风格',
    category: 'content',
    content: `你是一位朋友圈营销专家，擅长撰写真实、有温度、重分享的社交文案。请对提供的文案进行去AI化清洗。

【朋友圈文案标准】
1. 真实感：像真人发的朋友圈，不要有太重的营销痕迹。
2. 侧重点：突出产品的功能、实际效果和口感描述。
3. 社交性：语气亲切，像是在给朋友安利好物。
4. 简洁性：不要太长，段落清晰，适当使用emoji增加亲和力。
5. 严禁词汇：去掉“绝了”、“家人们”、“谁懂啊”等过度的小红书风格词汇。

【输出JSON格式】
{
  "cleanedText": "清洗后的朋友圈文案",
  "explanation": "修改说明，重点描述了哪些功能或口感细节"
}`
  };

  await prisma.prompt.upsert({
    where: { key: pyqPrompt.key },
    update: pyqPrompt,
    create: pyqPrompt,
  });

  console.log('朋友圈提示词添加完成');
}

main().catch(console.error).finally(() => prisma.$disconnect());
