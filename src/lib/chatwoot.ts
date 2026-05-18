/**
 * Chatwoot API Client
 * Facilitates sending messages and interacting with the Chatwoot platform.
 */

interface ChatwootConfig {
  baseUrl: string;
  accountId: string;
  apiToken: string;
}

// In a real app, these should come from environment variables or database settings.
// Defaulting to empty strings to enable demo/mock mode if not set.
import { prisma } from '@/lib/db'

export async function sendChatwootMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  // Fetch config dynamically from the database
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['CHATWOOT_BASE_URL', 'CHATWOOT_ACCOUNT_ID', 'CHATWOOT_API_TOKEN'] }
    }
  })

  const config: Record<string, string> = {}
  settings.forEach(s => {
    config[s.key] = s.value
  })

  const baseUrl = config['CHATWOOT_BASE_URL']
  const accountId = config['CHATWOOT_ACCOUNT_ID']
  const apiToken = config['CHATWOOT_API_TOKEN']

  // Strict Production Check
  if (!baseUrl || !accountId || !apiToken) {
    console.error('[CHATWOOT] Cannot send message: Missing configuration in settings.')
    return {
      success: false,
      error: 'Отсутствуют настройки Chatwoot. Перейдите в раздел "Настройки" -> "Мессенджеры" и укажите параметры подключения.'
    };
  }

  try {
    const url = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': apiToken
      },
      body: JSON.stringify({
        content: content,
        message_type: 'outgoing',
        private: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[CHATWOOT API ERROR]', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `Chatwoot request failed with status ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id?.toString()
    };
  } catch (error: any) {
    console.error('[CHATWOOT NETWORK ERROR]', error);
    return {
      success: false,
      error: error.message || 'Network error occurred while contacting Chatwoot'
    };
  }
}
