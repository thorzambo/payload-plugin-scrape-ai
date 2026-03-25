class OpenAiProvider {
    constructor(client, model) {
        this.client = client;
        this.model = model;
    }
    static async create(config) {
        const model = config.model || 'gpt-4o-mini';
        try {
            const { default: OpenAI } = await import('openai');
            const client = new OpenAI({ apiKey: config.apiKey });
            return new OpenAiProvider(client, model);
        }
        catch {
            throw new Error(`[scrape-ai] AI provider 'openai' configured but 'openai' package not found. Run: npm install openai`);
        }
    }
    async complete(prompt, systemPrompt) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });
        return response.choices[0]?.message?.content || '';
    }
}
class AnthropicProvider {
    constructor(client, model) {
        this.client = client;
        this.model = model;
    }
    static async create(config) {
        const model = config.model || 'claude-haiku-4-5-20251001';
        try {
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey: config.apiKey });
            return new AnthropicProvider(client, model);
        }
        catch {
            throw new Error(`[scrape-ai] AI provider 'anthropic' configured but '@anthropic-ai/sdk' package not found. Run: npm install @anthropic-ai/sdk`);
        }
    }
    async complete(prompt, systemPrompt) {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        return textBlock?.text || '';
    }
}
/**
 * Create an AI provider from config. Returns null if SDK is not installed.
 */
export async function createAiProvider(config) {
    try {
        switch (config.provider) {
            case 'openai':
                return await OpenAiProvider.create(config);
            case 'anthropic':
                return await AnthropicProvider.create(config);
            default:
                console.warn(`[scrape-ai] Unknown AI provider: ${config.provider}`);
                return null;
        }
    }
    catch (error) {
        console.error(error.message);
        return null;
    }
}
export async function resolveAiProvider(pluginAiConfig, globalConfig) {
    if (!pluginAiConfig?.apiKey)
        return null;
    if (globalConfig?.aiEnabled) {
        return createAiProvider({
            provider: globalConfig.aiProvider || pluginAiConfig.provider,
            apiKey: pluginAiConfig.apiKey,
            model: globalConfig.aiModel || pluginAiConfig.model,
        });
    }
    return createAiProvider(pluginAiConfig);
}
export async function resolveAiProviderFromPayload(payload, pluginAiConfig) {
    try {
        const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
        return resolveAiProvider(pluginAiConfig, aiConfig);
    }
    catch {
        return pluginAiConfig ? resolveAiProvider(pluginAiConfig) : null;
    }
}
//# sourceMappingURL=provider.js.map