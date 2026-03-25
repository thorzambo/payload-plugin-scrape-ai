import type { Payload } from 'payload'
import type { ResolvedPluginConfig } from '../types'
import { processQueue } from './queue-processor'
import { retryErrors } from './error-recovery'

/**
 * Start the background scheduler that processes the sync queue
 * and handles error recovery.
 */
export function startScheduler(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
): () => void {
  const debounceMs = pluginOptions.sync.debounceMs

  payload.logger.info(`[scrape-ai] Scheduler started (interval: ${debounceMs}ms)`)

  // Main queue processing loop
  let isProcessing = false
  const queueInterval = setInterval(async () => {
    if (isProcessing) return
    isProcessing = true

    try {
      await processQueue(payload, pluginOptions)
    } catch (error: any) {
      payload.logger.error(`[scrape-ai] Queue processing error: ${error.message}`)
    } finally {
      isProcessing = false
    }
  }, debounceMs)
  queueInterval.unref()

  // Error recovery loop (every 5 minutes)
  let isRecovering = false
  const recoveryInterval = setInterval(async () => {
    if (isRecovering) return
    isRecovering = true

    try {
      await retryErrors(payload, pluginOptions)
    } catch (error: any) {
      payload.logger.error(`[scrape-ai] Error recovery failed: ${error.message}`)
    } finally {
      isRecovering = false
    }
  }, 5 * 60 * 1000)
  recoveryInterval.unref()

  // Monthly API call counter reset check (every hour)
  const resetInterval = setInterval(async () => {
    try {
      const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
      const resetDate = (aiConfig as any)?.aiApiCallCountResetDate
      const now = new Date()

      const resetDateObj = resetDate ? new Date(resetDate) : null
      const needsReset = !resetDateObj ||
        resetDateObj.getMonth() !== now.getMonth() ||
        resetDateObj.getFullYear() !== now.getFullYear()

      if (needsReset) {
        await payload.updateGlobal({
          slug: 'ai-config',
          data: {
            aiApiCallCount: 0,
            aiApiCallCountResetDate: now.toISOString(),
          },
        })
        payload.logger.info('[scrape-ai] Monthly API call counter reset')
      }
    } catch {
      // Non-critical
    }
  }, 60 * 60 * 1000)
  resetInterval.unref()

  return () => {
    clearInterval(queueInterval)
    clearInterval(recoveryInterval)
    clearInterval(resetInterval)
    payload.logger.info('[scrape-ai] Scheduler stopped')
  }
}
