import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const tokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } })
    const adminSetting = await prisma.systemSetting.findUnique({ where: { key: 'TELEGRAM_ADMIN_CHAT_ID' } })

    return NextResponse.json({
      telegramBotToken: tokenSetting?.value || '',
      telegramAdminChatId: adminSetting?.value || ''
    })
  } catch (error) {
    console.error('Failed to get Telegram settings', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telegramBotToken, telegramAdminChatId } = body

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: 'TELEGRAM_BOT_TOKEN' },
        update: { value: telegramBotToken || '' },
        create: { key: 'TELEGRAM_BOT_TOKEN', value: telegramBotToken || '' }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'TELEGRAM_ADMIN_CHAT_ID' },
        update: { value: telegramAdminChatId || '' },
        create: { key: 'TELEGRAM_ADMIN_CHAT_ID', value: telegramAdminChatId || '' }
      })
    ])

    // Automatically register/update the Telegram Bot API Webhook!
    if (telegramBotToken) {
      try {
        const origin = request.headers.get('origin') || new URL(request.url).origin
        const webhookUrl = `${origin}/api/telegram/webhook`
        console.log(`[TELEGRAM BOT] Registering webhook to: ${webhookUrl}`)
        
        const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${webhookUrl}`)
        const tgData = await tgRes.json()
        
        if (tgData.ok) {
          console.log('[TELEGRAM BOT SUCCESS] Webhook registered successfully!')
        } else {
          console.error('[TELEGRAM BOT ERROR] Failed to register webhook:', tgData.description)
        }
      } catch (tgError: any) {
        console.error('[TELEGRAM BOT EXCEPTION] Webhook registration failed:', tgError.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save Telegram settings', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
