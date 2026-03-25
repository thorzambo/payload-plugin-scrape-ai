'use client';
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Collapsible, Pagination, Pill } from '@payloadcms/ui';
const statusPillStyle = {
    synced: 'success',
    pending: 'warning',
    processing: 'light',
    error: 'error',
    'error-permanent': 'error',
};
export const ContentTable = () => {
    const [entries, setEntries] = useState([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [viewMode, setViewMode] = useState('rendered');
    const [filterStatus, setFilterStatus] = useState('');
    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (filterStatus)
                params.set('status', filterStatus);
            const res = await fetch(`/api/scrape-ai/entries?${params}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setEntries(data.docs || []);
                setTotalDocs(data.totalDocs);
                setTotalPages(data.totalPages);
            }
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchEntries(); }, [page, filterStatus]);
    const handleRowClick = async (id) => {
        if (selectedId === id) {
            setSelectedId(null);
            setDetail(null);
            return;
        }
        setSelectedId(id);
        try {
            const res = await fetch(`/api/scrape-ai/entry/${id}`, { credentials: 'include' });
            if (res.ok)
                setDetail(await res.json());
        }
        catch { }
    };
    const handleRegenerate = async (ids) => {
        await fetch('/api/scrape-ai/regenerate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ids }),
        });
        await fetchEntries();
    };
    return (_jsxs("div", { className: "scrape-ai-card", children: [_jsxs("div", { className: "scrape-ai-header-row", children: [_jsxs("h3", { className: "scrape-ai-card__heading", children: ["Content Entries (", totalDocs, ")"] }), _jsx("div", { className: "scrape-ai-filters", children: _jsxs("select", { className: "scrape-ai-field__select", value: filterStatus, onChange: (e) => { setFilterStatus(e.target.value); setPage(1); }, style: { width: 'auto' }, children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "synced", children: "Synced" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "error", children: "Error" }), _jsx("option", { value: "error-permanent", children: "Permanent Error" })] }) })] }), loading ? _jsx("div", { children: "Loading..." }) : (_jsxs(_Fragment, { children: [_jsxs("table", { className: "scrape-ai-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Title" }), _jsx("th", { children: "Collection" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Last Synced" }), _jsx("th", { children: "AI" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: entries.map((entry) => (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: "scrape-ai-row--clickable", onClick: () => handleRowClick(entry.id), children: [_jsxs("td", { children: [entry.title, entry.isDraft && _jsx(Pill, { pillStyle: "warning", size: "small", className: "scrape-ai-inline-pill", children: "DRAFT" })] }), _jsx("td", { children: entry.sourceCollection }), _jsx("td", { children: _jsx(Pill, { pillStyle: statusPillStyle[entry.status] || 'light', size: "small", children: entry.status }) }), _jsx("td", { children: entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '\u2014' }), _jsx("td", { children: entry.hasAiMeta ? 'Yes' : '\u2014' }), _jsx("td", { children: _jsx(Button, { type: "button", buttonStyle: "secondary", size: "small", onClick: (e) => { e.stopPropagation(); handleRegenerate([entry.id]); }, children: "Regenerate" }) })] }), selectedId === entry.id && detail && (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "scrape-ai-detail", children: [_jsxs("div", { className: "scrape-ai-detail__header", children: [_jsx(Button, { type: "button", buttonStyle: viewMode === 'rendered' ? 'primary' : 'secondary', size: "small", onClick: () => setViewMode('rendered'), children: "Rendered" }), _jsx(Button, { type: "button", buttonStyle: viewMode === 'raw' ? 'primary' : 'secondary', size: "small", onClick: () => setViewMode('raw'), children: "Raw Markdown" })] }), _jsx("pre", { className: "scrape-ai-code", children: viewMode === 'raw'
                                                            ? detail.markdown || 'No content'
                                                            : detail.markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content' }), detail.jsonLd && (_jsx(Collapsible, { header: "JSON-LD", initCollapsed: true, className: "scrape-ai-collapsible", children: _jsx("pre", { className: "scrape-ai-code", children: JSON.stringify(detail.jsonLd, null, 2) }) })), detail.aiMeta && (_jsx(Collapsible, { header: "AI Metadata", initCollapsed: true, className: "scrape-ai-collapsible", children: _jsx("pre", { className: "scrape-ai-code", children: JSON.stringify(detail.aiMeta, null, 2) }) }))] }) }))] }, entry.id))) })] }), _jsx(Pagination, { page: page, totalPages: totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1, onChange: setPage })] }))] }));
};
//# sourceMappingURL=ContentTable.js.map