import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          messages: true,
          messengerAccounts: true
        }
      })
      return NextResponse.json(patient)
    }

    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        lastMessageAt: true,
        messages: {
          select: {
            isRead: true,
            isIncoming: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
