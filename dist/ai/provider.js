"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAiProvider = createAiProvider;
exports.resolveAiProvider = resolveAiProvider;
class OpenAiProvider {
    constructor(client, model) {
        this.client = client;
        this.model = model;
    }
    static async create(config) {
        const model = config.model || 'gpt-4o-mini';
        try {
            const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
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
            const { default: Anthropic } = await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')));
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
async function createAiProvider(config) {
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
/**
 * Try to create provider from runtime config (ai-config global),
 * falling back to plugin options.
 */
async function resolveAiProvider(pluginAiConfig, globalConfig) {
    // Global config overrides plugin config if AI is enabled
    if (globalConfig?.aiEnabled && globalConfig.aiProvider && globalConfig.aiApiKey) {
        return createAiProvider({
            provider: globalConfig.aiProvider,
            apiKey: globalConfig.aiApiKey,
            model: globalConfig.aiModel,
        });
    }
    // Fall back to plugin config
    if (pluginAiConfig) {
        return createAiProvider(pluginAiConfig);
    }
    return null;
}
//# sourceMappingURL=provider.js.map