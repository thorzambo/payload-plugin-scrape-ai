'use client';
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
export const ContentTable = () => {
    const [entries, setEntries] = useState([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [viewMode, setViewMode] = useState('rendered');
    const [filterCollection, setFilterCollection] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (filterCollection)
                params.set('collection', filterCollection);
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
        catch {
            // Silent fail
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEntries();
    }, [page, filterCollection, filterStatus]);
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
        catch {
            // Silent fail
        }
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
    const statusColors = {
        synced: '#22c55e',
        pending: '#eab308',
        processing: '#3b82f6',
        error: '#ef4444',
        'error-permanent': '#991b1b',
    };
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.header, children: [_jsxs("h3", { style: styles.heading, children: ["Content Entries (", totalDocs, ")"] }), _jsx("div", { style: styles.filters, children: _jsxs("select", { style: styles.select, value: filterStatus, onChange: (e) => { setFilterStatus(e.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "synced", children: "Synced" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "error", children: "Error" }), _jsx("option", { value: "error-permanent", children: "Permanent Error" })] }) })] }), loading ? (_jsx("div", { children: "Loading..." })) : (_jsxs(_Fragment, { children: [_jsxs("table", { style: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: styles.th, children: "Title" }), _jsx("th", { style: styles.th, children: "Collection" }), _jsx("th", { style: styles.th, children: "Status" }), _jsx("th", { style: styles.th, children: "Last Synced" }), _jsx("th", { style: styles.th, children: "AI" }), _jsx("th", { style: styles.th, children: "Actions" })] }) }), _jsx("tbody", { children: entries.map((entry) => (_jsxs(React.Fragment, { children: [_jsxs("tr", { style: { ...styles.tr, cursor: 'pointer' }, onClick: () => handleRowClick(entry.id), children: [_jsxs("td", { style: styles.td, children: [entry.title, entry.isDraft && _jsx("span", { style: styles.draftBadge, children: "DRAFT" })] }), _jsx("td", { style: styles.td, children: entry.sourceCollection }), _jsxs("td", { style: styles.td, children: [_jsx("span", { style: {
                                                                ...styles.statusDot,
                                                                backgroundColor: statusColors[entry.status] || '#999',
                                                            } }), entry.status] }), _jsx("td", { style: styles.td, children: entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '—' }), _jsx("td", { style: styles.td, children: entry.hasAiMeta ? 'Yes' : '—' }), _jsx("td", { style: styles.td, children: _jsx("button", { style: styles.smallButton, onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleRegenerate([entry.id]);
                                                        }, children: "Regenerate" }) })] }), selectedId === entry.id && detail && (_jsx("tr", { children: _jsxs("td", { colSpan: 6, style: styles.detailPane, children: [_jsxs("div", { style: styles.detailHeader, children: [_jsx("button", { style: viewMode === 'rendered' ? styles.activeTab : styles.tab, onClick: () => setViewMode('rendered'), children: "Rendered" }), _jsx("button", { style: viewMode === 'raw' ? styles.activeTab : styles.tab, onClick: () => setViewMode('raw'), children: "Raw Markdown" })] }), _jsx("pre", { style: styles.codeBlock, children: viewMode === 'raw'
                                                            ? detail.markdown || 'No content'
                                                            : detail.markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content' }), detail.jsonLd && (_jsxs("details", { style: styles.details, children: [_jsx("summary", { children: "JSON-LD" }), _jsx("pre", { style: styles.codeBlock, children: JSON.stringify(detail.jsonLd, null, 2) })] })), detail.aiMeta && (_jsxs("details", { style: styles.details, children: [_jsx("summary", { children: "AI Metadata" }), _jsx("pre", { style: styles.codeBlock, children: JSON.stringify(detail.aiMeta, null, 2) })] }))] }) }))] }, entry.id))) })] }), _jsxs("div", { style: styles.pagination, children: [_jsx("button", { style: styles.pageButton, disabled: page <= 1, onClick: () => setPage(page - 1), children: "Previous" }), _jsxs("span", { style: styles.pageInfo, children: ["Page ", page, " of ", totalPages] }), _jsx("button", { style: styles.pageButton, disabled: page >= totalPages, onClick: () => setPage(page + 1), children: "Next" })] })] }))] }));
};
const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-0, white)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    heading: { margin: 0, fontSize: '16px', fontWeight: 600 },
    filters: { display: 'flex', gap: '8px' },
    select: {
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        fontSize: '13px',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '10px 12px',
        borderBottom: '2px solid var(--theme-elevation-100, #e0e0e0)',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: 'var(--theme-elevation-500, #888)',
    },
    tr: { borderBottom: '1px solid var(--theme-elevation-50, #f0f0f0)' },
    td: { padding: '10px 12px', fontSize: '14px' },
    statusDot: {
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        marginRight: '6px',
    },
    draftBadge: {
        marginLeft: '8px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        fontSize: '10px',
        fontWeight: 600,
    },
    smallButton: {
        padding: '4px 10px',
        fontSize: '12px',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    detailPane: {
        padding: '16px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    },
    detailHeader: { display: 'flex', gap: '8px', marginBottom: '12px' },
    tab: {
        padding: '6px 14px',
        fontSize: '12px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    activeTab: {
        padding: '6px 14px',
        fontSize: '12px',
        border: '1px solid #2563eb',
        borderRadius: '4px',
        backgroundColor: '#2563eb',
        color: 'white',
        cursor: 'pointer',
    },
    codeBlock: {
        padding: '12px',
        backgroundColor: 'var(--theme-elevation-100, #f0f0f0)',
        borderRadius: '6px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '400px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    details: { marginTop: '12px' },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        marginTop: '16px',
    },
    pageButton: {
        padding: '6px 14px',
        fontSize: '13px',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    pageInfo: { fontSize: '13px', color: 'var(--theme-elevation-500, #888)' },
};
//# sourceMappingURL=ContentTable.js.map