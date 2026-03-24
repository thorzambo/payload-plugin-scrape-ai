"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTable = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const ContentTable = () => {
    const [entries, setEntries] = (0, react_1.useState)([]);
    const [totalDocs, setTotalDocs] = (0, react_1.useState)(0);
    const [page, setPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedId, setSelectedId] = (0, react_1.useState)(null);
    const [detail, setDetail] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)('rendered');
    const [filterCollection, setFilterCollection] = (0, react_1.useState)('');
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('');
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
    (0, react_1.useEffect)(() => {
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
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.header, children: [(0, jsx_runtime_1.jsxs)("h3", { style: styles.heading, children: ["Content Entries (", totalDocs, ")"] }), (0, jsx_runtime_1.jsx)("div", { style: styles.filters, children: (0, jsx_runtime_1.jsxs)("select", { style: styles.select, value: filterStatus, onChange: (e) => { setFilterStatus(e.target.value); setPage(1); }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Statuses" }), (0, jsx_runtime_1.jsx)("option", { value: "synced", children: "Synced" }), (0, jsx_runtime_1.jsx)("option", { value: "pending", children: "Pending" }), (0, jsx_runtime_1.jsx)("option", { value: "error", children: "Error" }), (0, jsx_runtime_1.jsx)("option", { value: "error-permanent", children: "Permanent Error" })] }) })] }), loading ? ((0, jsx_runtime_1.jsx)("div", { children: "Loading..." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("table", { style: styles.table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Title" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Collection" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Status" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Last Synced" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "AI" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: entries.map((entry) => ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsxs)("tr", { style: { ...styles.tr, cursor: 'pointer' }, onClick: () => handleRowClick(entry.id), children: [(0, jsx_runtime_1.jsxs)("td", { style: styles.td, children: [entry.title, entry.isDraft && (0, jsx_runtime_1.jsx)("span", { style: styles.draftBadge, children: "DRAFT" })] }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: entry.sourceCollection }), (0, jsx_runtime_1.jsxs)("td", { style: styles.td, children: [(0, jsx_runtime_1.jsx)("span", { style: {
                                                                ...styles.statusDot,
                                                                backgroundColor: statusColors[entry.status] || '#999',
                                                            } }), entry.status] }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '—' }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: entry.hasAiMeta ? 'Yes' : '—' }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("button", { style: styles.smallButton, onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleRegenerate([entry.id]);
                                                        }, children: "Regenerate" }) })] }), selectedId === entry.id && detail && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsxs)("td", { colSpan: 6, style: styles.detailPane, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.detailHeader, children: [(0, jsx_runtime_1.jsx)("button", { style: viewMode === 'rendered' ? styles.activeTab : styles.tab, onClick: () => setViewMode('rendered'), children: "Rendered" }), (0, jsx_runtime_1.jsx)("button", { style: viewMode === 'raw' ? styles.activeTab : styles.tab, onClick: () => setViewMode('raw'), children: "Raw Markdown" })] }), (0, jsx_runtime_1.jsx)("pre", { style: styles.codeBlock, children: viewMode === 'raw'
                                                            ? detail.markdown || 'No content'
                                                            : detail.markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content' }), detail.jsonLd && ((0, jsx_runtime_1.jsxs)("details", { style: styles.details, children: [(0, jsx_runtime_1.jsx)("summary", { children: "JSON-LD" }), (0, jsx_runtime_1.jsx)("pre", { style: styles.codeBlock, children: JSON.stringify(detail.jsonLd, null, 2) })] })), detail.aiMeta && ((0, jsx_runtime_1.jsxs)("details", { style: styles.details, children: [(0, jsx_runtime_1.jsx)("summary", { children: "AI Metadata" }), (0, jsx_runtime_1.jsx)("pre", { style: styles.codeBlock, children: JSON.stringify(detail.aiMeta, null, 2) })] }))] }) }))] }, entry.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.pagination, children: [(0, jsx_runtime_1.jsx)("button", { style: styles.pageButton, disabled: page <= 1, onClick: () => setPage(page - 1), children: "Previous" }), (0, jsx_runtime_1.jsxs)("span", { style: styles.pageInfo, children: ["Page ", page, " of ", totalPages] }), (0, jsx_runtime_1.jsx)("button", { style: styles.pageButton, disabled: page >= totalPages, onClick: () => setPage(page + 1), children: "Next" })] })] }))] }));
};
exports.ContentTable = ContentTable;
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
        border: '1px solid var(--theme-elevation-900, #333)',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-900, #333)',
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