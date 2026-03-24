"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionToggles = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const CollectionToggles = () => {
    const [collections, setCollections] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchCollections = async () => {
        try {
            const res = await fetch('/api/scrape-ai/detected-collections', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setCollections(data.collections || []);
            }
        }
        catch {
            // Silent fail
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchCollections();
    }, []);
    const handleToggle = async (slug, enabled) => {
        // Optimistic update
        setCollections((prev) => prev.map((c) => (c.slug === slug ? { ...c, enabled } : c)));
        await fetch('/api/scrape-ai/toggle-collection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ collection: slug, enabled }),
        });
    };
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { children: "Loading collections..." });
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsx)("h3", { style: styles.heading, children: "Collection Toggles" }), (0, jsx_runtime_1.jsx)("div", { style: styles.list, children: collections.map((c) => ((0, jsx_runtime_1.jsxs)("div", { style: styles.row, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.info, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.name, children: c.label || c.slug }), (0, jsx_runtime_1.jsxs)("span", { style: styles.count, children: [c.docCount, " documents"] })] }), (0, jsx_runtime_1.jsxs)("label", { style: styles.toggle, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: c.enabled, onChange: (e) => handleToggle(c.slug, e.target.checked), style: styles.checkbox }), (0, jsx_runtime_1.jsx)("span", { style: styles.toggleLabel, children: c.enabled ? 'Enabled' : 'Disabled' })] })] }, c.slug))) })] }));
};
exports.CollectionToggles = CollectionToggles;
const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-0, white)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    },
    heading: {
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 600,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '6px',
    },
    info: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    name: {
        fontSize: '14px',
        fontWeight: 500,
    },
    count: {
        fontSize: '12px',
        color: 'var(--theme-elevation-400, #999)',
    },
    toggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
    },
    toggleLabel: {
        fontSize: '13px',
    },
};
//# sourceMappingURL=CollectionToggles.js.map