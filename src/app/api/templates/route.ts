import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: Fetch all templates
export async function GET() {
  try {
    let templates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })

    // If no templates exist, auto-seed default templates
    if (templates.length === 0) {
      console.log('Seeding default message templates...')
      const defaults = [
        { name: 'Напоминание о приеме', content: 'Здравствуйте, {{name}}! Напоминаем вам о записи на {{date}} в {{time}}. Ждем вас!' },
        { name: 'Приветствие нового пациента', content: 'Добро пожаловать в Klinika, {{name}}! Мы получили ваши данные и готовы записать вас на прием.' },
        { name: 'Запрос результатов', content: '{{name}}, добрый день! Пришлите, пожалуйста, результаты ваших последних анализов для карты.' }
      ]

      await prisma.template.createMany({
        data: defaults
      })

      templates = await prisma.template.findMany({
        orderBy: {
          createdAt: 'asc'
        }
      })
    }

    return NextResponse.json(templates)
  } catch (err: any) {
    console.error('Templates GET API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Create a new template
export async function POST(request: Request) {
  try {
    const { name, content } = await request.json()
    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const template = await prisma.template.create({
      data: {
        name,
        content
      }
    })

    return NextResponse.json(template)
  } catch (err: any) {
    console.error('Templates POST API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
