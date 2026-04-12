import OpenAI from 'openai'

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are the official assistant for Diaspora Vote (#DiasporaVote), a non-partisan civic platform connecting Zimbabweans abroad with democratic engagement and transparent information.

Your goals:
- Provide accurate, civic-focused information about Diaspora Vote's mission and programmes.
- Explain peaceful, lawful ways for diaspora citizens to participate and stay informed.
- Guide people to official site resources (membership, petitions, news) when relevant.
- Always be respectful, factual, and concise.

Core context:
- Diaspora Vote strengthens links between Zimbabweans overseas and democratic processes at home.
- The platform promotes non-violent civic participation, accountability, and access to reliable information.
- Positions on specific laws or amendments should be described in general civic terms unless quoting published materials on the site.

Call to action:
- Invite users to explore membership, petitions, and news on the website.
- For account or technical issues, direct users to the contact options on the site.

Response rules:
- If asked how to support, mention joining the platform, sharing accurate information, and following official channels.
- If asked for legal interpretation, give general civic information only (not legal advice).
- If the request is outside Diaspora Vote scope, politely suggest the contact form or official email.
- Do not invent facts, people, events, or legal claims.`

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  success: boolean
  response?: string
  error?: string
}

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Process a chat message using OpenAI
 * Used by both website chatbot and WhatsApp bot
 */
export async function processChat(
  message: string,
  conversationHistory: ConversationMessage[] = []
): Promise<ChatResponse> {
  try {
    if (!message || !message.trim()) {
      return {
        success: false,
        error: 'Message is required',
      }
    }

    const openai = getOpenAIClient()

    // Build conversation messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          })
        }
      })
    }

    // Add current message
    messages.push({ role: 'user', content: message.trim() })

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return {
      success: true,
      response,
    }
  } catch (error: any) {
    console.error('Error in chat service:', error)
    return {
      success: false,
      error: error.message || 'Failed to process chat message',
    }
  }
}

/**
 * Get the system prompt (useful for debugging or display)
 */
export function getSystemPrompt(): string {
  return SYSTEM_PROMPT
}
