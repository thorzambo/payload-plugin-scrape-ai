// Ambient declarations for optional peer dependencies.
// These allow dynamic import() to type-check without the packages installed.
declare module 'openai' {
  class OpenAI {
    constructor(options: { apiKey: string })
    chat: {
      completions: {
        create(params: any): Promise<any>
      }
    }
  }
  export default OpenAI
}

declare module '@anthropic-ai/sdk' {
  class Anthropic {
    constructor(options: { apiKey: string })
    messages: {
      create(params: any): Promise<any>
    }
  }
  export default Anthropic
}
