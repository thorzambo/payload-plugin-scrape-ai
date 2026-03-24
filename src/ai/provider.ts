import type { AiProviderConfig, IAiProvider } from '../types'

class OpenAiProvider implements IAiProvider {
  private client: any

  constructor(config: AiProviderConfig) {
    try {
      const OpenAI = require('openai')
      this.client = new OpenAI({ apiKey: config.apiKey })
    } catch {
      throw new Error(
        `[scrape-ai] AI provider 'openai' configured but 'openai' package not found. Run: npm install openai`,
      )
    }
  }

  async complete(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })
    return response.choices[0]?.message?.content || ''
  }
}

class AnthropicProvider implements IAiProvider {
  private client: any

  constructor(config: AiProviderConfig) {
    try {
      const Anthropic = require('@anthropic-ai/sdk')
      this.client = new Anthropic({ apiKey: config.apiKey })
    } catch {
      throw new Error(
        `[scrape-ai] AI provider 'anthropic' configured but '@anthropic-ai/sdk' package not found. Run: npm install @anthropic-ai/sdk`,
      )
    }
  }

  async complete(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((b: any) => b.type === 'text')
    return textBlock?.text || ''
  }
}

/**
 * Create an AI provider from config. Returns null if SDK is not installed.
 */
export function createAiProvider(config: AiProviderConfig): IAiProvider | null {
  try {
    switch (config.provider) {
      case 'openai':
        return new OpenAiProvider(config)
      case 'anthropic':
        return new AnthropicProvider(config)
      default:
        console.warn(`[scrape-ai] Unknown AI provider: ${config.provider}`)
        return null
    }
  } catch (error: any) {
    console.error(error.message)
    return null
  }
}

/**
 * Try to create provider from runtime config (ai-config global),
 * falling back to plugin options.
 */
export function resolveAiProvider(
  pluginAiConfig?: AiProviderConfig,
  globalConfig?: { aiEnabled: boolean; aiProvider?: string; aiApiKey?: string; aiModel?: string },
): IAiProvider | null {
  // Global config overrides plugin config if AI is enabled
  if (globalConfig?.aiEnabled && globalConfig.aiProvider && globalConfig.aiApiKey) {
    return createAiProvider({
      provider: globalConfig.aiProvider as 'openai' | 'anthropic',
      apiKey: globalConfig.aiApiKey,
      model: globalConfig.aiModel,
    })
  }

  // Fall back to plugin config
  if (pluginAiConfig) {
    return createAiProvider(pluginAiConfig)
  }

  return null
}
