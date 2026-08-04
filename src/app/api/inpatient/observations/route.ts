import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get observations for a specific hospitalization
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const hospitalizationId = searchParams.get('hospitalizationId')

    if (!hospitalizationId) {
      return NextResponse.json({ error: 'Missing hospitalizationId' }, { status: 400 })
    }

    const observations = await prisma.observation.findMany({
      where: { hospitalizationId },
      orderBy: { recordedAt: 'desc' }
    })

    return NextResponse.json(observations)
  } catch (error) {
    console.error('Error fetching observations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add a new observation
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { hospitalizationId, temperature, bloodPressure, heartRate, medications, notes } = body

    if (!hospitalizationId) {
      return NextResponse.json({ error: 'Missing hospitalizationId' }, { status: 400 })
    }

    const observation = await prisma.observation.create({
      data: {
        hospitalizationId,
        temperature: temperature ? parseFloat(temperature) : null,
        bloodPressure: bloodPressure || null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        medications: medications || null,
        notes: notes || null
      }
    })

    return NextResponse.json(observation)
  } catch (error) {
    console.error('Error creating observation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
