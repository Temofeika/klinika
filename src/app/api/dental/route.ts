import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

    const dentalRecords = await prisma.dentalRecord.findMany({
      where: { patientId },
      orderBy: { toothNumber: 'asc' }
    })

    return NextResponse.json(dentalRecords)
  } catch (error) {
    console.error('Error fetching dental records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patientId, toothNumber, status, notes } = body

    if (!patientId || !toothNumber || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert the dental record
    const record = await prisma.dentalRecord.upsert({
      where: {
        patientId_toothNumber: {
          patientId,
          toothNumber
        }
      },
      update: {
        status,
        notes: notes || null
      },
      create: {
        patientId,
        toothNumber,
        status,
        notes: notes || null
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error saving dental record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
