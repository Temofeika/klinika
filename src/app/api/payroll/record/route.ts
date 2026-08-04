import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { doctorId, periodStart, periodEnd, bonus, penalty, baseAmount, totalAmount, status } = body

    if (!doctorId) {
      return NextResponse.json({ error: 'Missing doctorId' }, { status: 400 })
    }

    // Upsert a payroll record for this period
    // In a real app we'd use a unique constraint on doctorId + period, here we just find first in period
    let record = await prisma.payrollRecord.findFirst({
      where: {
        doctorId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd)
      }
    })

    if (record) {
      record = await prisma.payrollRecord.update({
        where: { id: record.id },
        data: {
          bonus: bonus || 0,
          penalty: penalty || 0,
          baseAmount,
          totalAmount,
          status,
          paidAt: status === 'PAID' && record.status !== 'PAID' ? new Date() : record.paidAt
        }
      })
    } else {
      record = await prisma.payrollRecord.create({
        data: {
          doctorId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          baseAmount,
          bonus: bonus || 0,
          penalty: penalty || 0,
          totalAmount,
          status,
          paidAt: status === 'PAID' ? new Date() : null
        }
      })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error saving payroll record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
