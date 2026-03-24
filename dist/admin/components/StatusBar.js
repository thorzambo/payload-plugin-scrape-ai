"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StatusBar = () => {
    const [status, setStatus] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [regenerating, setRegenerating] = (0, react_1.useState)(false);
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
    (0, react_1.useEffect)(() => {
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
            await fetchStatus();
        }
        finally {
            setRegenerating(false);
        }
    };
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { style: styles.container, children: "Loading..." });
    if (!status)
        return (0, jsx_runtime_1.jsx)("div", { style: styles.container, children: "Failed to load status" });
    const statusColor = status.errorCount > 0 ? '#ef4444' : status.pendingCount > 0 ? '#eab308' : '#22c55e';
    const statusText = status.errorCount > 0
        ? `${status.errorCount} Errors`
        : status.pendingCount > 0
            ? `${status.pendingCount} Pending`
            : 'All Synced';
    const collectionCount = Object.keys(status.collections).length;
    return ((0, jsx_runtime_1.jsx)("div", { style: styles.container, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.row, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.statusGroup, children: [(0, jsx_runtime_1.jsx)("span", { style: { ...styles.pill, backgroundColor: statusColor }, children: statusText }), (0, jsx_runtime_1.jsxs)("span", { style: styles.stat, children: [status.totalEntries, " pages across ", collectionCount, " collections"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.rightGroup, children: [status.lastRebuild && ((0, jsx_runtime_1.jsxs)("span", { style: styles.timestamp, children: ["Last rebuild: ", new Date(status.lastRebuild).toLocaleString()] })), status.aiEnabled && ((0, jsx_runtime_1.jsxs)("span", { style: styles.aiPill, children: ["AI: ", status.aiApiCallCount, " calls"] })), (0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: handleRegenerateAll, disabled: regenerating, children: regenerating ? 'Regenerating...' : 'Regenerate All' })] })] }) }));
};
exports.StatusBar = StatusBar;
const styles = {
    container: {
        padding: '16px 24px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderBottom: '1px solid var(--theme-elevation-100, #e0e0e0)',
        marginBottom: '24px',
        borderRadius: '8px',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
    },
    statusGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    rightGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    pill: {
        padding: '4px 12px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
    },
    aiPill: {
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: '#8b5cf6',
        color: 'white',
        fontSize: '12px',
    },
    stat: {
        fontSize: '14px',
        color: 'var(--theme-elevation-600, #666)',
    },
    timestamp: {
        fontSize: '12px',
        color: 'var(--theme-elevation-400, #999)',
    },
    button: {
        padding: '8px 16px',
        backgroundColor: 'var(--theme-elevation-900, #333)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
    },
};
//# sourceMappingURL=StatusBar.js.map