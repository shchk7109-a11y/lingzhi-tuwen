/**
 * AI 图片自动打标签服务
 * 使用 Gemini 多模态能力分析图片，返回结构化标签
 * 通过谷高中转端点 api.gdoubolai.com/v1，image_url 模式
 */

export interface AutoTagResult {
  product: string | null;          // 识别到的产品名，null=未识别
  productLine: string;             // 产品线
  assetType: string;               // 素材类型 key
  contentTypes: string[];          // 适用内容类型
  platform: string[];              // 适用平台
  description: string;             // AI 生成的图片描述
  confidence: number;              // 0-1 置信度
  source: 'photo' | 'ai_generated' | 'upload';
}

// 灵芝水铺产品列表（硬编码 + 动态读取扩展）
const PRODUCTS = [
  { name: '清脂纤纤草本定制茶饮', line: '草本茶饮', desc: '清脂瘦身方向，含荷叶、决明子等' },
  { name: '补气焕活草本茶饮', line: '草本茶饮', desc: '补气方向，含黄芪、灵芝等' },
  { name: '湿祛轻畅草本定制茶饮', line: '草本茶饮', desc: '祛湿方向，含薏米、茯苓等' },
  { name: '红颜透润草本定制茶饮', line: '草本茶饮', desc: '美容方向，含红枣、枸杞、玫瑰等' },
  { name: '悦纤草本美式', line: '草本咖啡', desc: '纤体方向的草本咖啡' },
  { name: '悦活草本美式', line: '草本咖啡', desc: '活力方向的草本咖啡' },
  { name: '悦轻草本美式', line: '草本咖啡', desc: '轻体方向的草本咖啡' },
  { name: '悦颜草本美式', line: '草本咖啡', desc: '养颜方向的草本咖啡' },
];

function buildSystemPrompt(extraProducts?: Array<{ name: string; line: string; desc?: string }>): string {
  const allProducts = [...PRODUCTS, ...(extraProducts || [])];
  const productList = allProducts.map(p =>
    `- ${p.name}（${p.line}）${p.desc ? '：' + p.desc : ''}`
  ).join('\n');

  return `你是灵芝水铺的素材分析助手。分析上传的图片，返回结构化标签。

## 当前产品列表
${productList}

## 素材类型（选一个最匹配的 sceneType 值）
产品级素材（关联到具体产品）：
- 产品图：产品照片（产品正面照、产品特写、产品包装）
- 场景图：场景图（产品在生活场景中的展示）
- 配方图：配方图（原材料、成分展示、灵芝/枸杞/红枣等）
- 冲泡图：冲泡图（冲泡过程、饮品成品展示）
- 包装图：包装图（包装盒、礼盒、外包装设计）

品牌级素材（不绑定具体产品，productLine 应为"品牌通用"）：
- 店铺场景：门头、店内全景、吧台、陈列
- 店员操作：制作饮品、接待客户、服务过程
- 培训孵化：培训现场、团队合影、考察参观
- 品牌宣传：品牌 Logo、水印素材、宣传海报

## 适用平台（可多选）
- xhs_cover：适合小红书封面（3:4竖版，精美视觉）
- xhs_content：适合小红书内容图（补充说明）
- wechat：适合朋友圈（真实感、生活感）
- both：通用（以上都适合）

## 适用内容类型（可多选，不确定则留空）
- product_recommend：产品推荐
- constitution_edu：体质科普
- solar_term：节气养生
- ingredient_analysis：成分解读
- customer_testimony：客户见证
- transformation：转型故事
- project_visit：项目考察

## 图片来源判断
- photo：实拍照片（有真实光影、环境噪点）
- ai_generated：AI 生成（过于完美、有 AI 痕迹）
- upload：设计稿/合成图（有设计排版元素）

## 返回格式（严格 JSON，不要多余文字）
{
  "product": "产品全名" 或 null,
  "productLine": "草本茶饮" 或 "草本咖啡" 或 "品牌通用",
  "sceneType": "素材类型中文名",
  "contentTypes": ["类型1", "类型2"],
  "platform": ["平台1", "平台2"],
  "description": "一句话描述图片内容",
  "confidence": 0.85,
  "source": "photo"
}

注意：
- 如果图片中没有灵芝水铺的产品或品牌元素，product 设为 null，productLine 设为 "品牌通用"
- 如果完全无法归类（纯风景、无关图片），sceneType 设为 "未分类"，confidence 设为 0
- confidence 反映你对标签准确性的把握：>0.8 高确信，0.5-0.8 中等，<0.5 低确信
- product 必须是上面产品列表中的全名，不要缩写`;
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  aiConfig: { baseUrl: string; apiKey: string; modelName: string },
): Promise<AutoTagResult> {
  const systemPrompt = buildSystemPrompt();

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: aiConfig.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: '请分析这张图片并返回标签JSON。' },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 解析 JSON（可能被 markdown 代码块包裹）
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const result = JSON.parse(jsonStr);

    // 验证 product 是否在已知列表中
    const knownProducts = PRODUCTS.map(p => p.name);
    const validProduct = result.product && knownProducts.includes(result.product)
      ? result.product
      : result.product || null;

    // 映射 productLine
    let productLine = result.productLine || '品牌通用';
    if (validProduct) {
      const found = PRODUCTS.find(p => p.name === validProduct);
      if (found) productLine = found.line;
    }

    return {
      product: validProduct,
      productLine,
      assetType: result.sceneType || '未分类',
      contentTypes: Array.isArray(result.contentTypes) ? result.contentTypes : [],
      platform: Array.isArray(result.platform) ? result.platform : ['both'],
      description: result.description || '',
      confidence: typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.5,
      source: (['photo', 'ai_generated', 'upload'] as const).includes(result.source) ? result.source : 'upload',
    };
  } catch {
    return {
      product: null,
      productLine: '品牌通用',
      assetType: '未分类',
      contentTypes: [],
      platform: ['both'],
      description: content.slice(0, 100),
      confidence: 0,
      source: 'upload',
    };
  }
}

// 批量分析：串行调用（避免限速）
export async function analyzeImageBatch(
  images: Array<{ fileName: string; base64: string; mimeType: string }>,
  aiConfig: { baseUrl: string; apiKey: string; modelName: string },
): Promise<Array<{ fileName: string; tags: AutoTagResult }>> {
  const results: Array<{ fileName: string; tags: AutoTagResult }> = [];

  for (let i = 0; i < images.length; i++) {
    const { fileName, base64, mimeType } = images[i];
    try {
      const tags = await analyzeImage(base64, mimeType, aiConfig);
      results.push({ fileName, tags });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        fileName,
        tags: {
          product: null,
          productLine: '品牌通用',
          assetType: '未分类',
          contentTypes: [],
          platform: ['both'],
          description: `分析失败: ${message}`,
          confidence: 0,
          source: 'upload',
        },
      });
    }

    // 限速：每张间隔 500ms
    if (i < images.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}
