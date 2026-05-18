import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMaxMessage } from '@/lib/max'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, platform, content } = body

    if (!patientId || !platform || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const patientAccount = await prisma.messengerAccount.findFirst({
      where: {
        patientId,
        platform
      }
    });

    if (!patientAccount) {
      return NextResponse.json({ error: `Patient has no connected account for ${platform}` }, { status: 400 })
    }

    // Attempt to send via Max API if platform is MAX
    if (platform === 'MAX') {
      console.log(`Sending MAX message to ${patientAccount.externalId}...`);
      const maxRes = await sendMaxMessage(patientAccount.externalId, content, process.env.MAX_API_KEY);
      
      if (!maxRes.success) {
        console.error('Failed to send Max message:', maxRes.error);
        return NextResponse.json({ error: 'Failed to send message to Max platform' }, { status: 502 });
      }
    } else if (platform === 'CHATWOOT') {
      console.log(`Sending CHATWOOT message to conversation ${patientAccount.externalId}...`);
      const { sendChatwootMessage } = await import('@/lib/chatwoot');
      const chatRes = await sendChatwootMessage(patientAccount.externalId, content);

      if (!chatRes.success) {
        console.error('Failed to send Chatwoot message:', chatRes.error);
        return NextResponse.json({ error: 'Failed to send message via Chatwoot' }, { status: 502 });
      }
    } else {
      // In a real app, here we would call the Telegram API
      console.log(`Sending ${platform} message to patient ${patientId}: ${content}`)
    }

    // Save the outgoing message to the database
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          source: platform,
          isIncoming: false,
          isRead: true, // outgoing messages are read by default
          status: platform === 'TELEGRAM' ? 'PENDING' : 'SENT',
          patientId
        }
      }),
      prisma.patient.update({
        where: { id: patientId },
        data: { lastMessageAt: new Date() }
      })
    ]);

    return NextResponse.json({ success: true, message: message[0] })
  } catch (error) {
    console.error('Send API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
