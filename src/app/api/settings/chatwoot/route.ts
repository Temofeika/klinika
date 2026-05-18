import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['CHATWOOT_BASE_URL', 'CHATWOOT_ACCOUNT_ID', 'CHATWOOT_API_TOKEN', 'CHATWOOT_INBOX_ID'] }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    return NextResponse.json({
      baseUrl: config['CHATWOOT_BASE_URL'] || '',
      accountId: config['CHATWOOT_ACCOUNT_ID'] || '',
      apiToken: config['CHATWOOT_API_TOKEN'] || '',
      inboxId: config['CHATWOOT_INBOX_ID'] || ''
    })
  } catch (error) {
    console.error('Failed to get Chatwoot settings', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { baseUrl, accountId, apiToken, inboxId } = body

    // Update or create settings in a transaction
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: 'CHATWOOT_BASE_URL' },
        update: { value: baseUrl || '' },
        create: { key: 'CHATWOOT_BASE_URL', value: baseUrl || '' }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'CHATWOOT_ACCOUNT_ID' },
        update: { value: accountId || '' },
        create: { key: 'CHATWOOT_ACCOUNT_ID', value: accountId || '' }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'CHATWOOT_API_TOKEN' },
        update: { value: apiToken || '' },
        create: { key: 'CHATWOOT_API_TOKEN', value: apiToken || '' }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'CHATWOOT_INBOX_ID' },
        update: { value: inboxId || '' },
        create: { key: 'CHATWOOT_INBOX_ID', value: inboxId || '' }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save Chatwoot settings', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
