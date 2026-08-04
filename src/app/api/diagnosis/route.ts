import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  
  try {
    let diagnoses = []
    
    // Quick mock data if DB is empty or for immediate showcase without needing seeds
    const mockData = [
      { id: '1', code: 'J00', name: 'Острый назофарингит (насморк)' },
      { id: '2', code: 'J01.9', name: 'Острый синусит неуточненный' },
      { id: '3', code: 'J02.9', name: 'Острый фарингит неуточненный' },
      { id: '4', code: 'J03.9', name: 'Острый тонзиллит неуточненный (ангина)' },
      { id: '5', code: 'J04.0', name: 'Острый ларингит' },
      { id: '6', code: 'J06.9', name: 'Острая инфекция верхних дыхательных путей неуточненная (ОРВИ)' },
      { id: '7', code: 'I10', name: 'Эссенциальная [первичная] гипертензия' },
      { id: '8', code: 'I11.0', name: 'Гипертензивная болезнь сердца с сердечной недостаточностью' },
      { id: '9', code: 'E11.9', name: 'Инсулинонезависимый сахарный диабет без осложнений' },
      { id: '10', code: 'M54.5', name: 'Боль внизу спины (Люмбаго)' }
    ]

    try {
      diagnoses = await prisma.diagnosisDictionary.findMany({
        where: {
          OR: [
            { code: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 20
      })
      
      // If DB is empty, use mock
      if (diagnoses.length === 0) {
        diagnoses = mockData.filter(d => 
          d.code.toLowerCase().includes(query.toLowerCase()) || 
          d.name.toLowerCase().includes(query.toLowerCase())
        )
      }
    } catch (e) {
      // Fallback if schema isn't fully migrated yet
      diagnoses = mockData.filter(d => 
        d.code.toLowerCase().includes(query.toLowerCase()) || 
        d.name.toLowerCase().includes(query.toLowerCase())
      )
    }

    return NextResponse.json(diagnoses)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
