import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/labs?patientId=... or all
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const orders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        service: true,
        results: true
      },
      orderBy: { orderDate: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/labs (Create lab order or add results)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'ADD_RESULT') {
      const { labOrderId, parameterName, value, unit, referenceRange, isAbnormal, notes } = body

      const result = await prisma.labResult.create({
        data: {
          labOrderId,
          parameterName,
          value,
          unit: unit || '',
          referenceRange: referenceRange || '',
          isAbnormal: !!isAbnormal,
          notes: notes || ''
        }
      })

      // Update lab order status to COMPLETED if not already
      await prisma.labOrder.update({
        where: { id: labOrderId },
        data: { status: 'COMPLETED' }
      }).catch(() => {})

      return NextResponse.json(result)
    }

    // Default: Create new Lab Order
    const { patientId, doctorId, serviceId, notes } = body

    if (!patientId || !doctorId) {
      return NextResponse.json({ error: 'Patient and Doctor ID required' }, { status: 400 })
    }

    const order = await prisma.labOrder.create({
      data: {
        patientId,
        doctorId,
        serviceId: serviceId || null,
        notes: notes || '',
        status: 'ORDERED'
      },
      include: {
        patient: true,
        doctor: true,
        service: true,
        results: true
      }
    })

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
