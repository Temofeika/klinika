import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Dummy Webhook for PBX (Zadarma, Mango, etc)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Example PBX Payload: { caller_id: '+79991234567', duration: 120, recording_url: 'https://pbx.com/rec/123.mp3' }
    const { caller_id, duration, recording_url } = body

    if (!caller_id) {
      return NextResponse.json({ error: 'caller_id is required' }, { status: 400 })
    }

    // Find if lead exists
    let lead = await prisma.lead.findFirst({
      where: { phone: { contains: caller_id.replace('+', '') } }
    })

    if (!lead) {
      // Create new lead if they called us
      lead = await prisma.lead.create({
        data: {
          name: 'Новый звонок',
          phone: caller_id,
          source: 'Входящий звонок',
          status: 'NEW'
        }
      })
    }

    // Log the interaction
    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        type: 'CALL',
        content: `Входящий звонок. Длительность: ${duration || 0} сек.`,
        audioUrl: recording_url || null,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Telephony webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
