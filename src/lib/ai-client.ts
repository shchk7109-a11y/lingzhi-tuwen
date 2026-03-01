import { prisma } from './prisma'

export type AIModel = 'deepseek' | 'kimi' | 'gemini'

interface AIResponse {
  content: string
  usage?: { prompt_tokens: number; completion_tokens: number }
}

async function getApiKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: 'api_key' } })
  return setting?.value || null
}

async function getModel(): Promise<AIModel> {
  const setting = await prisma.setting.findUnique({ where: { key: 'ai_model' } })
  return (setting?.value as AIModel) || 'deepseek'
}

export async function callAI(prompt: string, systemPrompt?: string): Promise<AIResponse> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('API Key not configured')

  const model = await getModel()
  const messages: { role: 'system' | 'user'; content: string }[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const configs = {
    deepseek: { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    kimi: { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' },
    gemini: { url: 'https://api.gdoubolai.com/v1/chat/completions', model: 'gemini-3-flash-preview' },
  }
  const config = configs[model]

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.7 }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`AI API error: ${response.status} - ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return { content: data.choices?.[0]?.message?.content || '', usage: data.usage }
}

export async function setApiKey(key: string): Promise<void> {
  await prisma.setting.upsert({ where: { key: 'api_key' }, update: { value: key }, create: { key: 'api_key', value: key } })
}

export async function setModel(model: AIModel): Promise<void> {
  await prisma.setting.upsert({ where: { key: 'ai_model' }, update: { value: model }, create: { key: 'ai_model', value: model } })
}

export async function getSettings(): Promise<{ apiKey: string | null; model: AIModel }> {
  return { apiKey: await getApiKey(), model: await getModel() }
}
