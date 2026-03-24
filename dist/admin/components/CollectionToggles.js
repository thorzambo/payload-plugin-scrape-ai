'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const CollectionToggles = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
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
    useEffect(() => {
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
        return _jsx("div", { children: "Loading collections..." });
    return (_jsxs("div", { style: styles.container, children: [_jsx("h3", { style: styles.heading, children: "Collection Toggles" }), _jsx("div", { style: styles.list, children: collections.map((c) => (_jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.info, children: [_jsx("span", { style: styles.name, children: c.label || c.slug }), _jsxs("span", { style: styles.count, children: [c.docCount, " documents"] })] }), _jsxs("label", { style: styles.toggle, children: [_jsx("input", { type: "checkbox", checked: c.enabled, onChange: (e) => handleToggle(c.slug, e.target.checked), style: styles.checkbox }), _jsx("span", { style: styles.toggleLabel, children: c.enabled ? 'Enabled' : 'Disabled' })] })] }, c.slug))) })] }));
};
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