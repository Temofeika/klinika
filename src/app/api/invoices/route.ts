import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/invoices?patientId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: true,
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/invoices (Create invoice or add payment)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'PAYMENT') {
      const { invoiceId, amount, paymentMethod, notes } = body

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || ''
        }
      })

      // Update invoice status to PAID
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
        include: { patient: true, items: true }
      }).catch(() => null)

      // Send payment receipt via Telegram
      if (updatedInvoice) {
        const tgAccount = await prisma.messengerAccount.findFirst({
          where: { patientId: updatedInvoice.patientId, platform: 'TELEGRAM' }
        })
        if (tgAccount) {
          const tokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } })
          if (tokenSetting?.value) {
            const msg = `✅ <b>Оплата получена!</b>\nСчет №${updatedInvoice.invoiceNumber} на сумму ${updatedInvoice.totalAmount} ₽ успешно оплачен.\n\nСпасибо, что выбираете нашу клинику!`
            await fetch(`https://api.telegram.org/bot${tokenSetting.value}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: tgAccount.externalId, text: msg, parse_mode: 'HTML' })
            }).catch(console.error)
          }
        }
      }

      return NextResponse.json(payment)
    }

    // Create Invoice
    const { patientId, items, doctorId } = body // items: [{ serviceName, price, quantity }]

    if (!patientId || !items || !items.length) {
      return NextResponse.json({ error: 'Patient ID and items required' }, { status: 400 })
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0)
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        invoiceNumber,
        totalAmount,
        status: 'UNPAID',
        items: {
          create: items.map((i: any) => ({
            serviceName: i.serviceName,
            price: parseFloat(i.price),
            quantity: i.quantity || 1,
            amount: parseFloat(i.price) * (i.quantity || 1),
            serviceId: i.serviceId || null,
            doctorId: doctorId || i.doctorId || null
          }))
        }
      },
      include: {
        patient: true,
        items: true,
        payments: true
      }
    })

    // Send invoice via Telegram
    const tgAccount = await prisma.messengerAccount.findFirst({
      where: { patientId: invoice.patientId, platform: 'TELEGRAM' }
    })
    if (tgAccount) {
      const tokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } })
      if (tokenSetting?.value) {
        const itemsList = invoice.items.map(i => `- ${i.serviceName}: ${i.amount} ₽`).join('\n')
        const msg = `🧾 <b>Новый счет №${invoice.invoiceNumber}</b>\n\n${itemsList}\n\n<b>К оплате: ${invoice.totalAmount} ₽</b>`
        await fetch(`https://api.telegram.org/bot${tokenSetting.value}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgAccount.externalId, text: msg, parse_mode: 'HTML' })
        }).catch(console.error)
      }
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
