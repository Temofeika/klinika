import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { leadId, patientId, managerId, type, content, plannedAt, status } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const interaction = await prisma.interaction.create({
      data: {
        leadId: leadId || null,
        patientId: patientId || null,
        managerId: managerId || null,
        type: type || 'NOTE',
        content,
        plannedAt: plannedAt ? new Date(plannedAt) : null,
        status: status || 'COMPLETED'
      },
      include: {
        manager: true
      }
    })

    return NextResponse.json(interaction)
  } catch (error: any) {
    console.error('Error creating interaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
