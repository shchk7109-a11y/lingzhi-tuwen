import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'

export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(prompts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, key, name, description, content, category } = body
    
    if (!id && !key) return NextResponse.json({ error: 'ID or key required' }, { status: 400 })
    
    let prompt
    if (id) {
      prompt = await prisma.prompt.update({
        where: { id },
        data: { name, description, content, category },
      })
    } else {
      prompt = await prisma.prompt.upsert({
        where: { key },
        update: { name, description, content, category },
        create: { key, name, description: description || '', content, category: category || 'general' },
      })
    }
    
    return NextResponse.json(prompt)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { key, name, description, content, category } = body
    if (!key || !name || !content) {
      return NextResponse.json({ error: 'key, name and content are required' }, { status: 400 })
    }
    const prompt = await prisma.prompt.create({
      data: { key, name, description: description || '', content, category: category || 'general' },
    })
    return NextResponse.json(prompt)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
  }
}
