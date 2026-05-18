import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('RECEIVE BODY:', body)
    // Expected: { platform: 'TELEGRAM' | 'MAX', externalId: string, content: string }
    const { platform, externalId, content } = body

    if (!platform || !externalId || !content) {
      console.log('Missing fields:', { platform, externalId, content })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Find the patient by their messenger account
    const account = await prisma.messengerAccount.findUnique({
      where: {
        platform_externalId: { platform, externalId }
      },
      include: { patient: true }
    })

    if (!account) {
      console.log('Account not found for:', platform, externalId)
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // 2. Create the message and update patient activity
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          source: platform,
          isIncoming: true,
          isRead: false,
          patientId: account.patientId
        }
      }),
      prisma.patient.update({
        where: { id: account.patientId },
        data: { lastMessageAt: new Date() }
      })
    ])

    console.log('SUCCESS: Message saved')
    return NextResponse.json({ success: true, message: message[0] })
  } catch (error: any) {
    console.error('Receive API error:', error.message, error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
