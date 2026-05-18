import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, telegramId, whatsappId, doctorId } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create patient and associated messenger accounts
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        doctorId: doctorId || null,
        messengerAccounts: {
          create: [
            ...(telegramId ? [{ platform: 'TELEGRAM', externalId: telegramId }] : []),
            ...(whatsappId ? [{ platform: 'WHATSAPP', externalId: whatsappId }] : []),
            // Default WhatsApp to phone if no ID provided
            ...(!whatsappId && phone ? [{ platform: 'WHATSAPP', externalId: phone }] : [])
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
