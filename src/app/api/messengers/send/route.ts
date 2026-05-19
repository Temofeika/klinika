import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMaxMessage } from '@/lib/max'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, platform, content, doctorId } = body

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

    // Fetch active doctor details if provided
    const doctor = doctorId ? await prisma.doctor.findUnique({ where: { id: doctorId } }) : null
    
    const getDoctorEmoji = (pos: string) => {
      const p = pos.toLowerCase()
      if (p.includes('систем')) return '💻'
      if (p.includes('администр')) return '📋'
      return '🩺'
    }

    // displayContent will be stored in database CRM chat
    const displayContent = doctor 
      ? `${getDoctorEmoji(doctor.position)} ${doctor.firstName} ${doctor.lastName} (${doctor.position}): ${content}` 
      : content

    // Attempt to send via Max API if platform is MAX
    if (platform === 'MAX') {
      console.log(`Sending MAX message to ${patientAccount.externalId}...`);
      
      const maxText = doctor
        ? `*${getDoctorEmoji(doctor.position)} ${doctor.firstName} ${doctor.lastName} (${doctor.position}):*\n${content}`
        : content

      const maxRes = await sendMaxMessage(patientAccount.externalId, maxText, process.env.MAX_API_KEY);

      if (!maxRes.success) {
        console.error('Failed to send Max message:', maxRes.error);
        return NextResponse.json({ error: 'Failed to send message to Max platform' }, { status: 502 });
      }
    } else if (platform === 'TELEGRAM') {
      console.log(`Sending TELEGRAM message via Bot API to chat ${patientAccount.externalId}...`);

      // Fetch Bot Token from database settings
      const tokenSetting = await prisma.systemSetting.findUnique({
        where: { key: 'TELEGRAM_BOT_TOKEN' }
      });
      const token = tokenSetting?.value;

      if (!token) {
        console.error('[TELEGRAM BOT] Cannot send message: Missing Bot Token in settings.');
        return NextResponse.json({
          error: 'Отсутствует Token Telegram-бота. Перейдите в "Настройки" -> "Мессенджеры" и укажите его.'
        }, { status: 400 });
      }

      const tgText = doctor
        ? `<b>${getDoctorEmoji(doctor.position)} ${doctor.firstName} ${doctor.lastName} (${doctor.position}):</b>\n${content}`
        : content

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: patientAccount.externalId,
            text: tgText,
            parse_mode: 'HTML'
          })
        });

        const tgData = await tgRes.json();

        if (!tgData.ok) {
          console.error('[TELEGRAM BOT API ERROR]', tgData.description);
          return NextResponse.json({ error: `Telegram Bot API error: ${tgData.description}` }, { status: 502 });
        }
      } catch (tgError: any) {
        console.error('[TELEGRAM BOT NETWORK ERROR]', tgError);
        return NextResponse.json({ error: 'Network error occurred while contacting Telegram Bot API' }, { status: 502 });
      }
    } else {
      console.log(`Sending ${platform} message to patient ${patientId}: ${displayContent}`)
    }

    // Save the outgoing message to the database
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: displayContent,
          source: platform,
          isIncoming: false,
          isRead: true, // outgoing messages are read by default
          status: 'SENT',
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
