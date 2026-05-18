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
  console.log('       Telegram-to-Chatwoot Userbot Bridge         ')
  console.log('===================================================')

  // 1. Get configurations from environment or prompt
  const CRM_URL = process.env.CRM_URL || 'https://klinika-ou7fr6y4j-temafeika-s-projects.vercel.app'
  console.log(`[CRM] Connecting to CRM at: ${CRM_URL}`)

  // Official Telegram Desktop client credentials (used as a safe, public fallback)
  const DEFAULT_API_ID = '2040'
  const DEFAULT_API_HASH = 'b18441a1ff607e10a989891a5625e74d'

  let apiIdStr = process.env.TELEGRAM_API_ID || DEFAULT_API_ID
  let apiHash = process.env.TELEGRAM_API_HASH || DEFAULT_API_HASH
  let phoneNumber = process.env.TELEGRAM_PHONE_NUMBER

  const apiId = parseInt(apiIdStr, 10)

  // 2. Fetch Chatwoot settings dynamically from the CRM
  let cwConfig: { baseUrl: string; accountId: string; apiToken: string; inboxId: string }
  try {
    console.log('[CRM] Pulling Chatwoot settings...')
    const res = await axios.get(`${CRM_URL}/api/settings/chatwoot`)
    cwConfig = res.data
    if (!cwConfig.baseUrl || !cwConfig.accountId || !cwConfig.apiToken || !cwConfig.inboxId) {
      console.error('[CRM ERROR] Chatwoot settings are incomplete in the CRM!')
      console.error('Пожалуйста, укажите URL, Account ID, Access Token и API Inbox ID в настройках CRM на Vercel.')
      process.exit(1)
    }
    console.log('[CRM SUCCESS] Loaded Chatwoot configuration successfully.')
  } catch (error: any) {
    console.error('[CRM ERROR] Failed to fetch Chatwoot settings from CRM:', error.message)
    process.exit(1)
  }

  // Helper headers for Chatwoot API
  const cwHeaders = {
    'Content-Type': 'application/json',
    'api_access_token': cwConfig.apiToken
  }

  // 3. Initialize Telegram Client (Userbot)
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
  console.log(`[USERBOT] Logged in as: ${myUser.firstName} (@${myUser.username || 'no_username'})`)

  // 4. Handle incoming Telegram messages (User -> Bridge -> Chatwoot)
  client.addEventHandler(async (event: any) => {
    const message = event.message
    
    // Only process private chats (not groups, channels, or outgoing)
    if (!message.isPrivate || message.out) return

    try {
      const sender = await message.getSender()
      if (!sender) return

      const senderId = sender.id.toString()
      const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || `User_${senderId}`
      const username = sender.username ? `@${sender.username}` : ''
      const text = message.text || '[Media / Unsupported Message Type]'

      console.log(`\n[TELEGRAM INCOMING] From: ${senderName} ${username} (ID: ${senderId}): "${text}"`)

      // Step A: Search for or create Contact in Chatwoot
      let contactId = ''
      const searchUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/contacts/search?q=telegram_${senderId}`
      const searchRes = await axios.get(searchUrl, { headers: cwHeaders })
      
      if (searchRes.data.payload && searchRes.data.payload.length > 0) {
        contactId = searchRes.data.payload[0].id.toString()
      } else {
        // Create new contact
        console.log(`[CHATWOOT] Contact 'telegram_${senderId}' not found. Creating new contact...`)
        const contactUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/contacts`
        const contactRes = await axios.post(contactUrl, {
          name: senderName,
          identifier: `telegram_${senderId}`,
          phone_number: sender.phone ? `+${sender.phone}` : undefined,
          inbox_id: parseInt(cwConfig.inboxId, 10)
        }, { headers: cwHeaders })
        contactId = contactRes.data.payload.contact.id.toString()
      }

      // Step B: Search or create Conversation in Chatwoot
      let conversationId = ''
      const convsUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/contacts/${contactId}/conversations`
      const convsRes = await axios.get(convsUrl, { headers: cwHeaders })
      
      // Look for open conversation in our Custom Inbox
      const activeConv = convsRes.data.payload?.find((c: any) => c.inbox_id === parseInt(cwConfig.inboxId, 10) && c.status !== 'resolved')
      
      if (activeConv) {
        conversationId = activeConv.id.toString()
      } else {
        console.log(`[CHATWOOT] Creating new conversation for contact ${contactId}...`)
        const createConvUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/conversations`
        const createConvRes = await axios.post(createConvUrl, {
          source_id: `telegram_${senderId}`,
          inbox_id: parseInt(cwConfig.inboxId, 10),
          contact_id: parseInt(contactId, 10)
        }, { headers: cwHeaders })
        conversationId = createConvRes.data.id.toString()
      }

      // Step C: Push message to Chatwoot
      const msgUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/conversations/${conversationId}/messages`
      await axios.post(msgUrl, {
        content: text,
        message_type: 'incoming'
      }, { headers: cwHeaders })

      console.log(`[CHATWOOT SUCCESS] Pushed message to Chatwoot Conversation: ${conversationId}`)
    } catch (e: any) {
      console.error('[BRIDGE INCOMING ERROR]', e.message)
    }
  }, new NewMessage({}))

  // 5. Poll CRM queue for outgoing replies (CRM -> Bridge -> Telegram)
  console.log('\n[BRIDGE QUEUE] Starting outgoing message polling loop (every 2 seconds)...')
  
  setInterval(async () => {
    try {
      const res = await axios.get(`${CRM_URL}/api/messengers/queue`)
      const queue = res.data

      if (queue && queue.length > 0) {
        for (const item of queue) {
          const { messageId, content, conversationId } = item
          console.log(`\n[QUEUE OUTGOING] Processing message ${messageId} for Chatwoot Conversation ${conversationId}`)

          try {
            // Step A: Fetch conversation to extract Telegram ID (stored in contact identifier)
            const convUrl = `${cwConfig.baseUrl}/api/v1/accounts/${cwConfig.accountId}/conversations/${conversationId}`
            const convRes = await axios.get(convUrl, { headers: cwHeaders })
            
            const identifier = convRes.data.meta?.sender?.identifier
            let telegramTarget: string | number = ''

            if (identifier && identifier.startsWith('telegram_')) {
              telegramTarget = parseInt(identifier.replace('telegram_', ''), 10)
            } else {
              // Fallback to phone number if identifier is not present
              const phone = convRes.data.meta?.sender?.phone_number
              if (phone) {
                telegramTarget = phone
              }
            }

            if (!telegramTarget) {
              console.error(`[QUEUE ERROR] Could not resolve Telegram Target for Conversation ${conversationId}. Skipping...`)
              continue
            }

            // Step B: Send message via GramJS
            console.log(`[USERBOT OUTGOING] Sending to ${telegramTarget}: "${content}"`)
            await client.sendMessage(telegramTarget, { message: content })
            console.log('[USERBOT SUCCESS] Message delivered to Telegram.')

            // Step C: Mark message as SENT in the CRM database
            await axios.post(`${CRM_URL}/api/messengers/queue`, {
              messageId,
              status: 'SENT'
            })
            console.log('[CRM SUCCESS] Marked message as SENT in CRM.')
          } catch (e: any) {
            console.error(`[QUEUE ITEM ERROR] Failed to dispatch message ${messageId}:`, e.message)
          }
        }
      }
    } catch (e: any) {
      // Quietly ignore network blips to avoid terminal spam
      if (e.code !== 'ECONNREFUSED' && e.code !== 'ENOTFOUND') {
        console.error('[QUEUE POLLING ERROR]', e.message)
      }
    }
  }, 2000)

  console.log('\n[STATUS] Telegram Bridge is fully running! Press Ctrl+C to stop.')
}

startBridge().catch((err) => {
  console.error('[FATAL BRIDGE ERROR]', err.message)
})
