import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { patientId } = await request.json()

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

    await prisma.message.updateMany({
      where: {
        patientId,
        isIncoming: true,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Read API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
