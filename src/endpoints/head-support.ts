import type { Endpoint, PayloadRequest } from 'payload'

/**
 * Creates a HEAD handler that mirrors a GET handler's response headers.
 *
 * WHY: ChatGPT, Perplexity, and many HTTP clients send HEAD first.
 * Without HEAD support, Payload returns 404 and the client gives up.
 */
export function withHeadSupport(endpointConfig: Endpoint): Endpoint[] {
  return [
    endpointConfig,
    {
      path: endpointConfig.path,
      method: 'head' as const,
      handler: async (req: PayloadRequest): Promise<Response> => {
        try {
          const originalResponse = await endpointConfig.handler(req)
          const headers: Record<string, string> = {}
          originalResponse.headers.forEach((value: string, key: string) => {
            headers[key] = value
          })
          return new Response(null, {
            status: originalResponse.status,
            headers,
          })
        } catch {
          return new Response(null, { status: 200 })
        }
      },
    },
  ]
}
