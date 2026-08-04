import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // format: YYYY-MM
    
    // Default to current month if not provided
    const date = month ? new Date(`${month}-01`) : new Date()
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const doctors = await prisma.doctor.findMany({
      include: {
        timesheets: {
          where: {
            date: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          orderBy: { date: 'asc' }
        },
        payrollRecords: {
          where: {
            periodStart: { gte: startOfMonth },
            periodEnd: { lte: endOfMonth }
          }
        },
        invoiceItems: {
          where: {
            invoice: {
              status: 'PAID',
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          },
          include: {
            invoice: true
          }
        }
      }
    })

    // Calculate payroll for each doctor
    const payrollData = doctors.map(doc => {
      const servicesTotal = doc.invoiceItems.reduce((acc, item) => acc + item.amount, 0)
      const commission = (servicesTotal * doc.commissionRate) / 100
      
      const existingRecord = doc.payrollRecords[0]
      const bonus = existingRecord?.bonus || 0
      const penalty = existingRecord?.penalty || 0
      
      const totalPayout = commission + bonus - penalty

      let totalHours = 0
      doc.timesheets.forEach(ts => {
        if (ts.clockIn && ts.clockOut) {
          const hours = (new Date(ts.clockOut).getTime() - new Date(ts.clockIn).getTime()) / (1000 * 60 * 60)
          totalHours += Math.max(0, hours)
        }
      })

      return {
        doctor: {
          id: doc.id,
          firstName: doc.firstName,
          lastName: doc.lastName,
          position: doc.position,
          commissionRate: doc.commissionRate
        },
        servicesTotal,
        commission,
        bonus,
        penalty,
        totalPayout,
        totalHours: totalHours.toFixed(1),
        timesheets: doc.timesheets,
        invoiceItems: doc.invoiceItems,
        recordId: existingRecord?.id || null,
        status: existingRecord?.status || 'PENDING'
      }
    })

    return NextResponse.json(payrollData)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
