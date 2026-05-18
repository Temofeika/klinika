import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/telegram/webhook
// This receives updates directly from the Telegram Bot API webhook.
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('[TELEGRAM WEBHOOK PAYLOAD]', JSON.stringify(payload))

    // We only process incoming text messages in private chats
    const messageObj = payload.message
    if (!messageObj || !messageObj.chat || messageObj.chat.type !== 'private') {
      return NextResponse.json({ status: 'ignored' })
    }

    const chat = messageObj.chat
    const fromUser = messageObj.from
    const content = messageObj.text

    if (!chat.id || !content) {
      return NextResponse.json({ error: 'Missing chat id or message content' }, { status: 400 })
    }

    const telegramId = chat.id.toString()
    const firstName = fromUser?.first_name || 'Telegram'
    const lastName = fromUser?.last_name || 'Patient'
    const username = fromUser?.username ? `@${fromUser.username}` : ''

    console.log(`[TELEGRAM INCOMING] From: ${firstName} ${lastName} ${username} (ID: ${telegramId}): "${content}"`)

    // 1. Find or create the patient / messenger account connection
    let account = await prisma.messengerAccount.findUnique({
      where: {
        platform_externalId: {
          platform: 'TELEGRAM',
          externalId: telegramId
        }
      },
      include: { patient: true }
    })

    if (!account) {
      console.log(`[TELEGRAM] First time patient. Auto-creating record for Telegram ID: ${telegramId}`)
      
      // Auto-create patient record
      const patient = await prisma.patient.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          phone: `+TG-${telegramId}` // Telegram API does not share user phone by default unless requested, so we save a dummy and let them fill it in
        }
      })

      // Link Messenger account
      account = await prisma.messengerAccount.create({
        data: {
          platform: 'TELEGRAM',
          externalId: telegramId,
          patientId: patient.id
        },
        include: { patient: true }
      })
      console.log(`[TELEGRAM SUCCESS] Created patient: ${patient.id} and linked Telegram account.`)
    }

    // 2. Save the incoming message in a database transaction and update lastMessageAt
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          source: 'TELEGRAM',
          isIncoming: true,
          isRead: false,
          status: 'SENT',
          patientId: account.patientId
        }
      }),
      prisma.patient.update({
        where: { id: account.patientId },
        data: { lastMessageAt: new Date() }
      })
    ])

    console.log(`[TELEGRAM SUCCESS] Saved incoming message: ${message[0].id}`)
    return NextResponse.json({ success: true, message: message[0] })
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK EXCEPTION]', error.message, error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
