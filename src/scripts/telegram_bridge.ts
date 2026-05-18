import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { NewMessage } from 'telegram/events'
import readline from 'readline'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SESSION_FILE = path.join(process.cwd(), 'telegram_session.txt')

// Terminal input helper using standard readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function startBridge() {
  console.log('===================================================')
  console.log('       Telegram-to-CRM Direct Userbot Sync         ')
  console.log('===================================================')

  // 1. Get configurations
  const CRM_URL = process.env.CRM_URL || 'https://klinika-ou7fr6y4j-temafeika-s-projects.vercel.app'
  console.log(`[CRM] Target CRM URL: ${CRM_URL}`)

  // Official Telegram Android client credentials (highly stable fallback)
  const DEFAULT_API_ID = '2899'
  const DEFAULT_API_HASH = '36722c7291de27bf50f4d27f827b494f'

  const apiIdStr = process.env.TELEGRAM_API_ID || DEFAULT_API_ID
  const apiHash = process.env.TELEGRAM_API_HASH || DEFAULT_API_HASH
  const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER

  const apiId = parseInt(apiIdStr, 10)

  // 2. Initialize Telegram Client (Userbot)
  let savedSession = ''
  if (fs.existsSync(SESSION_FILE)) {
    savedSession = fs.readFileSync(SESSION_FILE, 'utf8')
  }

  const stringSession = new StringSession(savedSession)
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5
  })

  // Start auth flow
  await client.start({
    phoneNumber: async () => phoneNumber || await question('Введите номер телефона клиники (например, +79991234567): '),
    password: async () => await question('Введите пароль двухфакторной аутентификации (если есть): '),
    phoneCode: async () => await question('Введите код из SMS от Telegram: '),
    onError: (err) => console.error('[TELEGRAM ERROR]', err.message)
  })

  // Save session for future runs
  const sessionStr = client.session.save() as unknown as string
  fs.writeFileSync(SESSION_FILE, sessionStr, 'utf8')
  console.log('[TELEGRAM SUCCESS] Successfully logged in and session saved.')

  const myUser: any = await client.getMe()
  console.log(`[USERBOT] Logged in directly as: ${myUser.firstName} (@${myUser.username || 'no_username'})`)

  // 3. Handle incoming Telegram messages (Telegram -> CRM Direct)
  client.addEventHandler(async (event: any) => {
    const message = event.message
    
    // Only process incoming private chats (no groups, no channels, no outgoing)
    if (!message.isPrivate || message.out) return

    try {
      const sender = await message.getSender()
      if (!sender) return

      const senderId = sender.id.toString()
      const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || `User_${senderId}`
      const text = message.text || '[Media / Unsupported Message Type]'
      const senderPhone = sender.phone ? `+${sender.phone}` : undefined

      console.log(`\n[TELEGRAM INCOMING] From: ${senderName} (ID: ${senderId}): "${text}"`)

      // Push directly to our CRM's receive API
      console.log('[CRM] Forwarding message to CRM...')
      const receiveUrl = `${CRM_URL}/api/messengers/receive`
      await axios.post(receiveUrl, {
        platform: 'TELEGRAM',
        externalId: senderId,
        content: text,
        phone: senderPhone,
        senderName: senderName
      })

      console.log('[CRM SUCCESS] Message successfully synced to CRM!')
    } catch (e: any) {
      console.error('[BRIDGE INCOMING ERROR] Failed to sync message to CRM:', e.response?.data || e.message)
    }
  }, new NewMessage({}))

  // 4. Poll CRM queue for outgoing replies (CRM -> Telegram Direct)
  console.log('\n[BRIDGE QUEUE] Starting outgoing message polling loop (every 2 seconds)...')
  
  setInterval(async () => {
    try {
      const res = await axios.get(`${CRM_URL}/api/messengers/queue`)
      const queue = res.data

      if (queue && queue.length > 0) {
        for (const item of queue) {
          const { messageId, content, telegramId, patientPhone } = item
          console.log(`\n[QUEUE OUTGOING] Processing message ${messageId} for Telegram user...`)

          // We prefer the Telegram ID, fallback to phone
          const target = telegramId || patientPhone

          if (!target) {
            console.error(`[QUEUE ERROR] Missing both Telegram ID and Phone for message ${messageId}. Skipping...`)
            continue
          }

          try {
            // Send direct message using GramJS
            console.log(`[USERBOT OUTGOING] Delivering to ${target}: "${content}"`)
            await client.sendMessage(target, { message: content })
            console.log('[USERBOT SUCCESS] Message successfully delivered to patient on Telegram.')

            // Mark message as SENT in our CRM database
            await axios.post(`${CRM_URL}/api/messengers/queue`, {
              messageId,
              status: 'SENT'
            })
            console.log('[CRM SUCCESS] Marked message as SENT in CRM.')
          } catch (e: any) {
            console.error(`[QUEUE ITEM ERROR] Failed to deliver message ${messageId}:`, e.message)
          }
        }
      }
    } catch (e: any) {
      // Quietly ignore network blips
      if (e.code !== 'ECONNREFUSED' && e.code !== 'ENOTFOUND') {
        console.error('[QUEUE POLLING ERROR]', e.message)
      }
    }
  }, 2000)

  console.log('\n[STATUS] Direct Telegram Sync Bridge is running! Press Ctrl+C to stop.')
}

startBridge().catch((err) => {
  console.error('[FATAL BRIDGE ERROR]', err.message)
})
