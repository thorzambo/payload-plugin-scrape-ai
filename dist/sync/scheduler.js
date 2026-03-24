import { processQueue } from './queue-processor';
import { retryErrors } from './error-recovery';
/**
 * Start the background scheduler that processes the sync queue
 * and handles error recovery.
 */
export function startScheduler(payload, pluginOptions, aiProvider) {
    const debounceMs = pluginOptions.sync.debounceMs;
    payload.logger.info(`[scrape-ai] Scheduler started (interval: ${debounceMs}ms)`);
    // Main queue processing loop
    let isProcessing = false;
    const queueInterval = setInterval(async () => {
        if (isProcessing)
            return;
        isProcessing = true;
        try {
            await processQueue(payload, pluginOptions, aiProvider);
        }
        catch (error) {
            payload.logger.error(`[scrape-ai] Queue processing error: ${error.message}`);
        }
        finally {
            isProcessing = false;
        }
    }, debounceMs);
    queueInterval.unref();
    // Error recovery loop (every 5 minutes)
    let isRecovering = false;
    const recoveryInterval = setInterval(async () => {
        if (isRecovering)
            return;
        isRecovering = true;
        try {
            await retryErrors(payload, pluginOptions);
        }
        catch (error) {
            payload.logger.error(`[scrape-ai] Error recovery failed: ${error.message}`);
        }
        finally {
            isRecovering = false;
        }
    }, 5 * 60 * 1000);
    recoveryInterval.unref();
    // Monthly API call counter reset check (every hour)
    const resetInterval = setInterval(async () => {
        try {
            const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
            const resetDate = aiConfig?.aiApiCallCountResetDate;
            const now = new Date();
            if (!resetDate || new Date(resetDate).getMonth() !== now.getMonth()) {
                await payload.updateGlobal({
                    slug: 'ai-config',
                    data: {
                        aiApiCallCount: 0,
                        aiApiCallCountResetDate: now.toISOString(),
                    },
                });
                payload.logger.info('[scrape-ai] Monthly API call counter reset');
            }
        }
        catch {
            // Non-critical
        }
    }, 60 * 60 * 1000);
    resetInterval.unref();
}
//# sourceMappingURL=scheduler.js.map