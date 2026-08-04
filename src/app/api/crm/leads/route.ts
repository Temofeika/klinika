import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all leads
export async function GET(req: Request) {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        manager: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: { manager: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(leads)
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new lead
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, source, expectedAmount, managerId } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        source: source || 'Входящий звонок',
        expectedAmount: parseFloat(expectedAmount || 0),
        managerId: managerId || null,
        status: 'NEW'
      },
      include: { manager: true, interactions: true }
    })

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update lead (status, amount, etc)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { leadId, status, expectedAmount, managerId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (expectedAmount !== undefined) updateData.expectedAmount = parseFloat(expectedAmount)
    if (managerId !== undefined) updateData.managerId = managerId

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: { manager: true, interactions: true }
    })

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
