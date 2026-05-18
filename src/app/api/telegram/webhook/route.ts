import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '+7' + cleaned.substring(1)
  }
  if (cleaned.startsWith('7') && cleaned.length === 11) {
    cleaned = '+' + cleaned
  }
  if (!cleaned.startsWith('+') && cleaned.length > 0) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

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

// Helper to retrieve the actual file download URL from Telegram API
async function getTelegramFileUrl(token: string, fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
    const data = await res.json()
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`
    }
  } catch (e: any) {
    console.error('[TELEGRAM WEBHOOK GET FILE ERROR]', e.message)
  }
  return null
}

// Helper to save client documents to their medical record JSON
async function addDocumentToPatient(
  patientId: string,
  docName: string,
  docType: 'IMAGE' | 'PDF',
  docSize: string,
  docUrl: string,
  platformName: string
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  })
  if (!patient) return

  let medical: any = { documents: [], history: [] }
  if (patient.medicalRecord) {
    try {
      medical = JSON.parse(patient.medicalRecord)
    } catch (e) {
      console.error('Failed to parse medicalRecord JSON:', e)
    }
  }

  if (!Array.isArray(medical.documents)) medical.documents = []
  if (!Array.isArray(medical.history)) medical.history = []

  const newDoc = {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(),
    name: docName,
    type: docType,
    size: docSize,
    date: new Date().toISOString(),
    url: docUrl
  }

  medical.documents.unshift(newDoc)

  const today = new Date().toLocaleDateString('ru-RU')
  medical.history.unshift({
    date: today,
    desc: `Получен файл от пациента через ${platformName}: "${docName}" (${docSize}).`
  })

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      medicalRecord: JSON.stringify(medical)
    }
  })
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
      const phone = normalizePhone(rawPhone)
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
              "Спасибо! Мы успешно идентифицировали вас в нашей системе. Врач видит всю вашу историю приемов и ответит вам прямо здесь.",
              { remove_keyboard: true }
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
              "Спасибо! Ваш номер телефона успешно подтвержден. Врач скоро ответит вам.",
              { remove_keyboard: true }
            )
          }
        }
      }

      return NextResponse.json({ success: true, status: 'contact_processed' })
    }

    // 2. HANDLE REGULAR TEXT MESSAGES & ATTACHMENTS
    const content = messageObj.text || ''
    const photo = messageObj.photo
    const document = messageObj.document

    const hasPhoto = Array.isArray(photo) && photo.length > 0
    const hasDocument = !!document

    if (!content && !hasPhoto && !hasDocument) {
      return NextResponse.json({ status: 'ignored_no_text_or_attachment' })
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
      
      const adminDoctor = await prisma.doctor.findFirst({
        where: { OR: [{ username: 'admin' }, { position: 'Администратор' }] }
      })

      const patient = await prisma.patient.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          phone: `+TG-${telegramId}`, // temporary placeholder until shared
          doctorId: adminDoctor?.id || null
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

    // Process attachments if present
    let finalContent = content
    
    // Process Document Attachment
    if (hasDocument && token) {
      const fileId = document.file_id
      const rawName = document.file_name || `document_${Date.now()}.pdf`
      const mimeType = document.mime_type || ''
      const sizeBytes = document.file_size || 0
      const kbSize = sizeBytes > 0 ? `${(sizeBytes / 1024).toFixed(1)} KB` : 'Unknown'
      
      const fileType = mimeType.startsWith('image/') ? 'IMAGE' : 'PDF'
      
      const fileUrl = await getTelegramFileUrl(token, fileId)
      if (fileUrl) {
        await addDocumentToPatient(
          account.patientId,
          rawName,
          fileType,
          kbSize,
          fileUrl,
          'Telegram'
        )
        
        const icon = fileType === 'IMAGE' ? '🖼️ Фото' : '📎 Документ'
        const linkMarkdown = `${icon}: [${rawName}](${fileUrl})`
        if (finalContent) {
          finalContent += `\n${linkMarkdown}`
        } else {
          finalContent = linkMarkdown
        }
      }
    }

    // Process Photo Attachment
    if (hasPhoto && token) {
      const targetPhoto = photo[photo.length - 1]
      const fileId = targetPhoto.file_id
      const sizeBytes = targetPhoto.file_size || 0
      const kbSize = sizeBytes > 0 ? `${(sizeBytes / 1024).toFixed(1)} KB` : 'Unknown'
      const photoName = `Фото_Телеграм_${new Date().toLocaleDateString('ru-RU')}_${Math.floor(Math.random() * 1000)}.jpg`
      
      const fileUrl = await getTelegramFileUrl(token, fileId)
      if (fileUrl) {
        await addDocumentToPatient(
          account.patientId,
          photoName,
          'IMAGE',
          kbSize,
          fileUrl,
          'Telegram'
        )
        
        const linkMarkdown = `🖼️ Фото: [${photoName}](${fileUrl})`
        if (finalContent) {
          finalContent += `\n${linkMarkdown}`
        } else {
          finalContent = linkMarkdown
        }
      }
    }

    // Save message and update activity time
    const savedMessage = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: finalContent,
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
