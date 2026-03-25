'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Banner, Button, Pill } from '@payloadcms/ui';
export const StatusBar = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/scrape-ai/status', { credentials: 'include' });
            if (res.ok)
                setStatus(await res.json());
        }
        catch {
            // Silent fail
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);
    const handleRegenerateAll = async () => {
        setRegenerating(true);
        try {
            await fetch('/api/scrape-ai/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ all: true }),
            });
            // Poll aggressively until entries reappear (sync runs on scheduler tick)
            let attempts = 0;
            const pollUntilReady = setInterval(async () => {
                attempts++;
                const res = await fetch('/api/scrape-ai/status', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                    if (data.totalEntries > 0 || attempts >= 30) {
                        clearInterval(pollUntilReady);
                        setRegenerating(false);
                    }
                }
            }, 2000);
        }
        catch {
            setRegenerating(false);
        }
    };
    if (loading)
        return _jsx(Banner, { type: "default", children: "Loading..." });
    if (!status)
        return _jsx(Banner, { type: "error", children: "Failed to load status" });
    const bannerType = regenerating ? 'info'
        : status.errorCount > 0 ? 'error'
            : status.pendingCount > 0 ? 'info'
                : 'success';
    const statusText = regenerating ? 'Regenerating...'
        : status.errorCount > 0 ? `${status.errorCount} Errors`
            : status.pendingCount > 0 ? `${status.pendingCount} Pending`
                : 'All Synced';
    const collectionCount = Object.keys(status.collections).length;
    return (_jsx(Banner, { type: bannerType, children: _jsxs("div", { className: "scrape-ai-status__row", children: [_jsxs("div", { className: "scrape-ai-status__group", children: [_jsx(Pill, { pillStyle: status.errorCount > 0 ? 'error' : status.pendingCount > 0 ? 'warning' : 'success', children: statusText }), _jsxs("span", { className: "scrape-ai-status__stat", children: [status.totalEntries, " pages across ", collectionCount, " collections"] })] }), _jsxs("div", { className: "scrape-ai-status__group", children: [status.lastRebuild && (_jsxs("span", { className: "scrape-ai-status__timestamp", children: ["Last rebuild: ", new Date(status.lastRebuild).toLocaleString()] })), status.aiEnabled && (_jsxs(Pill, { pillStyle: "dark", children: ["AI: ", status.aiApiCallCount, " calls"] })), _jsx(Button, { type: "button", buttonStyle: "primary", size: "small", onClick: handleRegenerateAll, disabled: regenerating, children: regenerating ? 'Regenerating...' : 'Regenerate All' })] })] }) }));
};
//# sourceMappingURL=StatusBar.js.map