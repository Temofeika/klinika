import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const reminders = await prisma.interaction.findMany({
      where: {
        type: 'TASK',
        status: 'PLANNED',
        plannedAt: {
          lte: today
        }
      },
      include: {
        lead: true,
        patient: true
      },
      orderBy: { plannedAt: 'asc' }
    })

    return NextResponse.json(reminders)
  } catch (error: any) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
