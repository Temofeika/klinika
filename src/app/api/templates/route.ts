import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    let templates = []

    const mockTemplates = [
      { 
        id: '1', 
        name: 'Первичный осмотр (Терапевт)', 
        content: JSON.stringify({
          complaints: 'Жалобы на общую слабость, повышение температуры тела до 38.0, кашель.',
          anamnesis: 'Считает себя больным в течение 3 дней. Заболевание связывает с переохлаждением. Самостоятельно принимал парацетамол без эффекта.',
          objective: 'Состояние удовлетворительное. Сознание ясное. Кожные покровы чистые, нормальной влажности. В легких дыхание везикулярное, хрипов нет. Тоны сердца ясные, ритмичные.',
          treatmentPlan: '1. Обильное теплое питье.\n2. Парацетамол 500мг при температуре выше 38.5.\n3. Повторный осмотр через 3 дня.'
        })
      },
      { 
        id: '2', 
        name: 'Норма (Без патологий)', 
        content: JSON.stringify({
          complaints: 'Жалоб нет. Профилактический осмотр.',
          anamnesis: 'Хронические заболевания отрицает. Аллергологический анамнез не отягощен.',
          objective: 'Общее состояние удовлетворительное. Видимые слизистые розовые, чистые. Лимфатические узлы не увеличены. Дыхание везикулярное. Живот мягкий, безболезненный.',
          treatmentPlan: 'Практически здоров. Рекомендовано соблюдение режима труда и отдыха.'
        })
      }
    ]

    try {
      templates = await prisma.medicalTemplate.findMany({
        take: 10
      })
      if (templates.length === 0) templates = mockTemplates
    } catch (e) {
      templates = mockTemplates
    }

    return NextResponse.json(templates)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
