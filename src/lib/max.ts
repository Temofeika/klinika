/**
 * Max Messenger API Client
 * This module simulates or handles real interactions with the Max platform API.
 */

interface MaxSendMessagePayload {
  to: string;
  text: string;
}

interface MaxSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMaxMessage(
  phoneOrId: string,
  content: string,
  apiKey?: string
): Promise<MaxSendMessageResponse> {
  // If no real API key is configured, simulate a successful response
  if (!apiKey || apiKey === 'demo_mode') {
    console.log(`[MAX API SIMULATION] Sending message to ${phoneOrId}: "${content}"`);
    return {
      success: true,
      messageId: `max_sim_${Date.now()}`
    };
  }

  // Real API integration logic
  try {
    const payload: MaxSendMessagePayload = {
      to: phoneOrId,
      text: content
    };

    const response = await fetch('https://platform-api.max.ru/v1/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MAX API ERROR]', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `API request failed with status ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId || `max_${Date.now()}`
    };
  } catch (error: any) {
    console.error('[MAX API NETWORK ERROR]', error);
    return {
      success: false,
      error: error.message || 'Network error occurred while contacting Max API'
    };
  }
}
