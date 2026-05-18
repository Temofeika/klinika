import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: Fetch all pending outgoing messages for the local bridge to deliver
export async function GET() {
  try {
    const pendingMessages = await prisma.message.findMany({
      where: {
        status: 'PENDING',
        isIncoming: false
      },
      include: {
        patient: {
          include: {
            messengerAccounts: {
              where: { platform: 'TELEGRAM' }
            }
          }
        }
      }
    })

    // Format the queue payload
    const queue = pendingMessages.map(msg => {
      const telegramAccount = msg.patient.messengerAccounts[0]
      return {
        messageId: msg.id,
        content: msg.content,
        telegramId: telegramAccount?.externalId || '',
        patientPhone: msg.patient.phone,
        patientName: `${msg.patient.firstName} ${msg.patient.lastName}`.trim()
      }
    })

    return NextResponse.json(queue)
  } catch (error: any) {
    console.error('[QUEUE GET ERROR]', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Update the status of a queued message (mark as SENT/DELIVERED)
export async function POST(request: Request) {
  try {
    const { messageId, status } = await request.json()

    if (!messageId || !status) {
      return NextResponse.json({ error: 'Missing messageId or status' }, { status: 400 })
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { status }
    })

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (error: any) {
    console.error('[QUEUE POST ERROR]', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
