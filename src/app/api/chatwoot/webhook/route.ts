import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('[CHATWOOT WEBHOOK]', payload.event)

    // Only process incoming messages
    if (payload.event !== 'message_created' || payload.message_type !== 'incoming') {
      return NextResponse.json({ status: 'ignored' })
    }

    const conversationId = payload.conversation?.id?.toString()
    const content = payload.content || ''
    const senderPhone = payload.contact?.phone_number
    const senderName = payload.contact?.name

    const attachments = payload.attachments
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0

    if (!conversationId || (!content && !hasAttachments)) {
      return NextResponse.json({ error: 'Missing content and attachments' }, { status: 400 })
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

    // Process attachments if present
    let messageContent = content
    if (hasAttachments) {
      for (const att of attachments) {
        const fileUrl = att.data_url
        const fileType = att.file_type === 'image' ? 'IMAGE' : 'PDF'
        
        let fileName = `chatwoot_file_${Date.now()}`
        try {
          const urlObj = new URL(fileUrl)
          const pathname = urlObj.pathname
          const parts = pathname.split('/')
          const lastPart = parts[parts.length - 1]
          if (lastPart && lastPart.includes('.')) {
            fileName = decodeURIComponent(lastPart)
          } else {
            fileName = `document_${Date.now()}.${fileType === 'IMAGE' ? 'jpg' : 'pdf'}`
          }
        } catch (e) {}

        const docSize = '1.5 MB'

        await addDocumentToPatient(
          account.patientId,
          fileName,
          fileType,
          docSize,
          fileUrl,
          'Chatwoot'
        )

        const icon = fileType === 'IMAGE' ? '🖼️ Фото' : '📎 Документ'
        const linkMarkdown = `${icon}: [${fileName}](${fileUrl})`
        if (messageContent) {
          messageContent += `\n${linkMarkdown}`
        } else {
          messageContent = linkMarkdown
        }
      }
    }

    // Save the message
    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: messageContent,
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
