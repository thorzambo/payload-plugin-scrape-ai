'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Pill } from '@payloadcms/ui';
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
        catch { }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchCollections(); }, []);
    const handleToggle = async (slug, enabled) => {
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
    return (_jsxs("div", { className: "scrape-ai-card", children: [_jsx("h3", { className: "scrape-ai-card__heading", children: "Collection Toggles" }), _jsx("div", { className: "scrape-ai-toggles", children: collections.map((c) => (_jsxs("div", { className: "scrape-ai-toggle-row", children: [_jsxs("div", { className: "scrape-ai-toggle-row__info", children: [_jsx("span", { className: "scrape-ai-toggle-row__name", children: c.label || c.slug }), _jsxs("span", { className: "scrape-ai-toggle-row__count", children: [c.docCount, " documents"] })] }), _jsx(Pill, { pillStyle: c.enabled ? 'success' : 'light-gray', onClick: () => handleToggle(c.slug, !c.enabled), children: c.enabled ? 'Enabled' : 'Disabled' })] }, c.slug))) })] }));
};
//# sourceMappingURL=CollectionToggles.js.map