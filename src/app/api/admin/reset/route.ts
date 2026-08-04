import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    // Delete transactional data but keep Doctors, Services, Settings
    await prisma.interaction.deleteMany({})
    await prisma.lead.deleteMany({})
    await prisma.message.deleteMany({})
    await prisma.appointment.deleteMany({})
    await prisma.payrollRecord.deleteMany({})
    await prisma.timesheet.deleteMany({})
    await prisma.invoiceItem.deleteMany({})
    await prisma.invoice.deleteMany({})
    await prisma.messengerAccount.deleteMany({})
    await prisma.labResult.deleteMany({})
    await prisma.labOrder.deleteMany({})
    await prisma.dentalRecord.deleteMany({})
    await prisma.hospitalization.deleteMany({})
    // Do not delete bed, ward, department (structural data)
    await prisma.patient.deleteMany({})

    return NextResponse.json({ success: true, message: 'Тестовые данные успешно удалены!' })
  } catch (error: any) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
