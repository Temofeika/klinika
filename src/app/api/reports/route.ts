import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const totalPatients = await prisma.patient.count()
    const totalLabOrders = await prisma.labOrder.count()
    const totalInvoices = await prisma.invoice.count()

    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID' }
    })
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0)

    const unpaidInvoices = await prisma.invoice.findMany({
      where: { status: { not: 'PAID' } }
    })
    const unpaidRevenue = unpaidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0)

    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { patients: true }
        }
      },
      orderBy: {
        patients: {
          _count: 'desc'
        }
      }
    })

    return NextResponse.json({
      totalPatients,
      totalLabOrders,
      totalInvoices,
      totalRevenue,
      unpaidRevenue,
      doctors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
