import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('[CHATWOOT WEBHOOK]', payload.event)

    // Only process incoming messages
    if (payload.event !== 'message_created' || payload.message_type !== 'incoming') {
      return NextResponse.json({ status: 'ignored' })
    }

    const conversationId = payload.conversation?.id?.toString()
    const content = payload.content
    const senderPhone = payload.contact?.phone_number
    const senderName = payload.contact?.name

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required fields in payload' }, { status: 400 })
    }

    // Attempt to find the patient via existing Chatwoot connection
    let account = await prisma.messengerAccount.findUnique({
      where: {
        platform_externalId: {
          platform: 'CHATWOOT',
          externalId: conversationId
        }
      },
      include: { patient: true }
    })

    // If no existing connection, try to find patient by phone and create the connection
    if (!account && senderPhone) {
      const patient = await prisma.patient.findUnique({
        where: { phone: senderPhone }
      })

      if (patient) {
        account = await prisma.messengerAccount.create({
          data: {
            platform: 'CHATWOOT',
            externalId: conversationId,
            patientId: patient.id
          },
          include: { patient: true }
        })
      }
    }

    // Auto-create patient if not found and auto-creation is allowed (using a fake phone for now if missing)
    if (!account) {
      const patientPhone = senderPhone || `+000${Math.floor(Math.random() * 10000000)}`
      const [firstName, lastName] = (senderName || 'New Contact').split(' ')
      
      const newPatient = await prisma.patient.create({
        data: {
          firstName: firstName || 'New',
          lastName: lastName || 'Contact',
          phone: patientPhone,
        }
      })

      account = await prisma.messengerAccount.create({
        data: {
          platform: 'CHATWOOT',
          externalId: conversationId,
          patientId: newPatient.id
        },
        include: { patient: true }
      })
      console.log(`[CHATWOOT] Auto-created new patient: ${newPatient.id}`)
    }

    // Save the message
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          source: 'CHATWOOT',
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

    return NextResponse.json({ success: true, message: message[0] })
  } catch (error: any) {
    console.error('[CHATWOOT WEBHOOK ERROR]', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
