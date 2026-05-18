import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Helper to send messages to Telegram Bot API
async function sendTelegramMessage(token: string, chatId: string, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup
      })
    })
  } catch (e: any) {
    console.error('[TELEGRAM WEBHOOK SEND ERROR]', e.message)
  }
}

// POST /api/telegram/webhook
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('[TELEGRAM WEBHOOK PAYLOAD]', JSON.stringify(payload))

    const messageObj = payload.message
    if (!messageObj || !messageObj.chat || messageObj.chat.type !== 'private') {
      return NextResponse.json({ status: 'ignored' })
    }

    const chat = messageObj.chat
    const fromUser = messageObj.from
    const telegramId = chat.id.toString()
    
    // Fetch Bot Token from settings
    const tokenSetting = await prisma.systemSetting.findUnique({
      where: { key: 'TELEGRAM_BOT_TOKEN' }
    })
    const token = tokenSetting?.value

    // 1. HANDLE SHARE CONTACT UPDATE
    if (messageObj.contact) {
      let rawPhone = messageObj.contact.phone_number
      // Ensure phone starts with '+'
      const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`
      console.log(`[TELEGRAM WEBHOOK] Received shared contact: ${phone} for user ID: ${telegramId}`)

      // Find the current temporary patient and messenger account
      const currentAccount = await prisma.messengerAccount.findUnique({
        where: {
          platform_externalId: {
            platform: 'TELEGRAM',
            externalId: telegramId
          }
        },
        include: { patient: true }
      })

      if (currentAccount) {
        const tempPatientId = currentAccount.patientId

        // Check if a patient record with this phone number ALREADY exists in the database
        const existingPatient = await prisma.patient.findUnique({
          where: { phone }
        })

        if (existingPatient && existingPatient.id !== tempPatientId) {
          console.log(`[TELEGRAM MERGE] Patient with phone ${phone} already exists (ID: ${existingPatient.id}). Merging accounts...`)

          // Update messenger account to point to the existing patient card
          await prisma.messengerAccount.update({
            where: { id: currentAccount.id },
            data: { patientId: existingPatient.id }
          })

          // Move all messages from the temp patient card to the existing patient card
          await prisma.message.updateMany({
            where: { patientId: tempPatientId },
            data: { patientId: existingPatient.id }
          })

          // Clean up/delete the temporary patient card
          try {
            await prisma.patient.delete({
              where: { id: tempPatientId }
            })
            console.log(`[TELEGRAM MERGE SUCCESS] Deleted temporary patient ID: ${tempPatientId}`)
          } catch (delError: any) {
            console.error('[TELEGRAM MERGE CLEANUP ERROR]', delError.message)
          }

          if (token) {
            await sendTelegramMessage(
              token, 
              telegramId, 
              "Спасибо! Мы успешно идентифицировали вас в нашей системе. Врач видит всю вашу историю приемов и ответит вам прямо здесь."
            )
          }
        } else {
          // If no existing patient matches, just update the temporary patient with their actual phone number!
          console.log(`[TELEGRAM PHONE UPDATE] No existing patient. Updating current card with phone: ${phone}`)
          await prisma.patient.update({
            where: { id: tempPatientId },
            data: { phone }
          })

          if (token) {
            await sendTelegramMessage(
              token, 
              telegramId, 
              "Спасибо! Ваш номер телефона успешно подтвержден. Врач скоро ответит вам."
            )
          }
        }
      }

      return NextResponse.json({ success: true, status: 'contact_processed' })
    }

    // 2. HANDLE REGULAR TEXT MESSAGES
    const content = messageObj.text
    if (!content) {
      return NextResponse.json({ status: 'ignored_no_text' })
    }

    const firstName = fromUser?.first_name || 'Telegram'
    const lastName = fromUser?.last_name || 'Patient'

    // Look up or create temporary patient card
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
      console.log(`[TELEGRAM] Auto-creating temporary patient for ID: ${telegramId}`)
      
      const patient = await prisma.patient.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          phone: `+TG-${telegramId}` // temporary placeholder until shared
        }
      })

      account = await prisma.messengerAccount.create({
        data: {
          platform: 'TELEGRAM',
          externalId: telegramId,
          patientId: patient.id
        },
        include: { patient: true }
      })
    }

    // If message is "/start", automatically prompt the user to share their phone number
    if (content.trim() === '/start') {
      console.log(`[TELEGRAM] User started chat. Sending Request Contact button...`)
      
      if (token) {
        await sendTelegramMessage(
          token,
          telegramId,
          `Здравствуйте, ${firstName}! Добро пожаловать в нашу клинику. 😊\n\nЧтобы мы могли связать этот чат с вашей медицинской картой и ответить вам, пожалуйста, подтвердите ваш номер телефона, нажав кнопку «📱 Поделиться номером» ниже.`,
          {
            keyboard: [
              [
                {
                  text: '📱 Поделиться номером',
                  request_contact: true
                }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        )
      }

      // We still save the /start message in database so the doctor sees when they logged in
      const startMsg = await prisma.message.create({
        data: {
          content: '/start',
          source: 'TELEGRAM',
          isIncoming: true,
          isRead: false,
          status: 'SENT',
          patientId: account.patientId
        }
      })

      return NextResponse.json({ success: true, message: startMsg })
    }

    // Save normal text messages and update activity time
    const savedMessage = await prisma.$transaction([
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

    console.log(`[TELEGRAM SUCCESS] Saved message: ${savedMessage[0].id}`)
    return NextResponse.json({ success: true, message: savedMessage[0] })
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK EXCEPTION]', error.message, error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
