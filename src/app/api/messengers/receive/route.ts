import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('RECEIVE BODY:', body)
    // Expected: { platform: 'TELEGRAM' | 'MAX', externalId: string, content: string, phone?: string, senderName?: string }
    const { platform, externalId, content, phone, senderName } = body

    if (!platform || !externalId || !content) {
      console.log('Missing fields:', { platform, externalId, content })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Find the patient by their messenger account
    let account = await prisma.messengerAccount.findUnique({
      where: {
        platform_externalId: { platform, externalId }
      },
      include: { patient: true }
    })

    // If account not found, try to match by phone or auto-create patient
    if (!account) {
      console.log(`[RECEIVE] Account not found for ${platform}:${externalId}. Resolving patient...`)
      let patient = null

      if (phone) {
        patient = await prisma.patient.findUnique({
          where: { phone }
        })
      }

      if (!patient) {
        // Create new patient since they don't exist
        const [firstName, lastName] = (senderName || 'Telegram Patient').split(' ')
        patient = await prisma.patient.create({
          data: {
            firstName: firstName || 'Telegram',
            lastName: lastName || 'Patient',
            phone: phone || `+TG-${externalId}`,
          }
        })
        console.log(`[RECEIVE] Auto-created new patient: ${patient.id}`)
      }

      // Link messenger account
      account = await prisma.messengerAccount.create({
        data: {
          platform,
          externalId,
          patientId: patient.id
        },
        include: { patient: true }
      })
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
