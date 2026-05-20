import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDischargePdf } from '@/lib/pdf'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, discharge } = body

    if (!patientId || !discharge) {
      return NextResponse.json({ error: 'patientId and discharge data are required' }, { status: 400 })
    }

    // 1. Fetch current patient record
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { messengerAccounts: true }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // 2. Parse current medical records
    let medical: any = { documents: [], history: [] }
    if (patient.medicalRecord) {
      try {
        medical = JSON.parse(patient.medicalRecord)
      } catch (e) {
        console.error('Failed to parse patient.medicalRecord JSON:', e)
      }
    }

    if (!Array.isArray(medical.history)) medical.history = []

    // 3. Update the discharge info in medicalRecord
    medical.discharge = discharge

    // 4. Update the patient record
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        medicalRecord: JSON.stringify(medical)
      }
    })

    // 5. If completed, handle Telegram Bot notification
    if (discharge.status === 'COMPLETED') {
      const tgAccount = patient.messengerAccounts.find(acc => acc.platform === 'TELEGRAM')
      
      if (tgAccount) {
        // Fetch Telegram Bot Token from database settings
        const tokenSetting = await prisma.systemSetting.findUnique({
          where: { key: 'TELEGRAM_BOT_TOKEN' }
        })
        const token = tokenSetting?.value

        if (token) {
          const requestUrl = new URL(request.url)
          const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
          const dischargeLink = `${baseUrl}/discharge/${patientId}`

          const tgText = `🏥 <b>Ваша медицинская выписка готова!</b>\n\n` +
            `📅 <b>Период лечения:</b> ${discharge.startDate} — ${discharge.endDate}\n` +
            `🩺 <b>Клинический диагноз:</b> ${discharge.diagnosis}\n` +
            `👨‍⚕️ <b>Лечащий врач:</b> ${discharge.attendingDoctorName}\n\n` +
            `Вы можете также просмотреть веб-версию бланка, распечатать или экспортировать в Word по ссылке:\n` +
            `🔗 <a href="${dischargeLink}">Открыть веб-бланк выписки</a>`

          try {
            console.log(`[API DISCHARGE] Generating PDF for patient ${patientId}...`)
            const pdfBuffer = await generateDischargePdf(patient, discharge)

            console.log(`[API DISCHARGE] Sending Telegram PDF notification to chat ${tgAccount.externalId}...`)
            
            const boundary = '----TelegramFormBoundary' + Math.random().toString(36).substring(2)
            const replyMarkupStr = JSON.stringify({
              keyboard: [[{ text: "📄 Получить выписку" }]],
              resize_keyboard: true
            })
            
            const lastName = patient.lastName || ''
            const firstName = patient.firstName || ''
            const rawFileName = `Vypiska_${lastName}_${firstName}`.replace(/[^a-zA-Z0-9_а-яА-Я]/g, '')
            const fileName = `${rawFileName || 'discharge'}.pdf`
            
            const startStr = 
              `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
              `${tgAccount.externalId}\r\n` +
              `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="caption"\r\n\r\n` +
              `${tgText}\r\n` +
              `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="parse_mode"\r\n\r\n` +
              `HTML\r\n` +
              `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="reply_markup"\r\n\r\n` +
              `${replyMarkupStr}\r\n` +
              `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="document"; filename="${fileName}"\r\n` +
              `Content-Type: application/pdf\r\n\r\n`
              
            const startBuf = Buffer.from(startStr, 'utf-8')
            const endBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
            const body = Buffer.concat([startBuf, pdfBuffer, endBuf])

            const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
              method: 'POST',
              headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
              body: body
            })

            const tgData = await tgRes.json()

            if (tgData.ok) {
              console.log('[API DISCHARGE] Telegram PDF notification sent successfully!')
              
              // Save the outgoing notification message to the database CRM chat log
              const displayContent = `🏥 Автоматическое уведомление: Отправлена выписка в PDF. Ссылка: ${dischargeLink}`

              await prisma.$transaction([
                prisma.message.create({
                  data: {
                    content: displayContent,
                    source: 'TELEGRAM',
                    isIncoming: false,
                    isRead: true,
                    status: 'SENT',
                    patientId
                  }
                }),
                prisma.patient.update({
                  where: { id: patientId },
                  data: { lastMessageAt: new Date() }
                })
              ])
            } else {
              console.error('[API DISCHARGE] Telegram Bot API returned error:', tgData.description)
            }
          } catch (tgError: any) {
            console.error('[API DISCHARGE] Network error sending Telegram message:', tgError.message)
          }
        } else {
          console.warn('[API DISCHARGE] Telegram Bot Token not configured in settings. Skipping notification.')
        }
      } else {
        console.log(`[API DISCHARGE] Patient ${patientId} has no Telegram account connected. Notification skipped.`)
      }
    }

    return NextResponse.json({ success: true, patient: updatedPatient })
  } catch (err: any) {
    console.error('[API DISCHARGE EXCEPTION]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
