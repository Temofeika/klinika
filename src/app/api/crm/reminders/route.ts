import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const reminders = await prisma.interaction.findMany({
      where: {
        type: 'TASK',
        status: 'PLANNED',
        plannedAt: {
          lte: today
        }
      },
      include: {
        lead: true,
        patient: true
      },
      orderBy: { plannedAt: 'asc' }
    })

    // Telegram Notification logic
    const now = new Date()
    const dueUnnotifiedTasks = reminders.filter(r => r.plannedAt && r.plannedAt <= now && !r.tgNotified)

    if (dueUnnotifiedTasks.length > 0) {
      const tokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } })
      const adminSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_ADMIN_CHAT_ID' } })
      
      const token = tokenSetting?.value
      const adminChatId = adminSetting?.value

      if (token && adminChatId) {
        for (const task of dueUnnotifiedTasks) {
          const clientName = task.lead?.name || task.patient?.firstName || 'Неизвестный клиент'
          const phone = task.lead?.phone || task.patient?.phone || ''
          const text = `🔔 <b>Напоминание по задаче!</b>\n\n👤 <b>Клиент:</b> ${clientName} (${phone})\n📝 <b>Задача:</b> ${task.content}\n⏰ <b>Время:</b> ${task.plannedAt?.toLocaleString('ru-RU')}`
          
          try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: adminChatId,
                text: text,
                parse_mode: 'HTML'
              })
            })
            // Mark as notified
            await prisma.interaction.update({
              where: { id: task.id },
              data: { tgNotified: true }
            })
          } catch (e) {
            console.error('Error sending telegram notification for task', e)
          }
        }
      } else {
        // Just mark them as notified so we don't retry forever if TG is not configured
        for (const task of dueUnnotifiedTasks) {
           await prisma.interaction.update({
             where: { id: task.id },
             data: { tgNotified: true }
           })
        }
      }
    }

    return NextResponse.json(reminders)
  } catch (error: any) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
