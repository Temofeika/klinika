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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, telegramId, whatsappId, doctorId } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    // Pre-emptive duplicate check
    const existing = await prisma.patient.findUnique({
      where: { phone: normalizedPhone }
    })
    if (existing) {
      return NextResponse.json({ error: 'Пациент с таким номером телефона уже зарегистрирован!' }, { status: 409 })
    }

    // Create patient and associated messenger accounts
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone: normalizedPhone,
        email,
        doctorId: doctorId || null,
        messengerAccounts: {
          create: [
            ...(telegramId ? [{ platform: 'TELEGRAM', externalId: telegramId }] : []),
            ...(whatsappId ? [{ platform: 'WHATSAPP', externalId: whatsappId }] : []),
            // Default WhatsApp to phone if no ID provided
            ...(!whatsappId && normalizedPhone ? [{ platform: 'WHATSAPP', externalId: normalizedPhone }] : [])
          ]
        }
      },
      include: {
        messengerAccounts: true
      }
    })

    return NextResponse.json(patient)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Patient with this phone number already exists' }, { status: 409 })
    }
    console.error('Create Patient API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
