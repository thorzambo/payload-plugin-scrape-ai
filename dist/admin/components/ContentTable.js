'use client';
import React, { useEffect, useState } from 'react';
import { Button, Collapsible, Pagination, Pill } from '@payloadcms/ui';
const statusPillStyle = {
    synced: 'success',
    pending: 'warning',
    processing: 'light',
    error: 'error',
    'error-permanent': 'error'
};
export const ContentTable = ()=>{
    const [entries, setEntries] = useState([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [viewMode, setViewMode] = useState('rendered');
    const [filterStatus, setFilterStatus] = useState('');
    const [deadLetterEntries, setDeadLetterEntries] = useState([]);
    const [deadLetterCount, setDeadLetterCount] = useState(0);
    const fetchEntries = async ()=>{
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20'
            });
            if (filterStatus) params.set('status', filterStatus);
            const res = await fetch(`/api/scrape-ai/entries?${params}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data.docs || []);
                setTotalDocs(data.totalDocs);
                setTotalPages(data.totalPages);
            }
        } catch  {} finally{
            setLoading(false);
        }
    };
    const fetchDeadLetter = async ()=>{
        try {
            const res = await fetch('/api/scrape-ai/dead-letter', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setDeadLetterEntries(data.docs || []);
                setDeadLetterCount(data.totalDocs || 0);
            }
        } catch  {}
    };
    useEffect(()=>{
        fetchEntries();
        fetchDeadLetter();
    }, [
        page,
        filterStatus
    ]);
    const handleRowClick = async (id)=>{
        if (selectedId === id) {
            setSelectedId(null);
            setDetail(null);
            return;
        }
        setSelectedId(id);
        try {
            const res = await fetch(`/api/scrape-ai/entry/${id}`, {
                credentials: 'include'
            });
            if (res.ok) setDetail(await res.json());
        } catch  {}
    };
    const handleRegenerate = async (ids)=>{
        await fetch('/api/scrape-ai/regenerate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                ids
            })
        });
        await fetchEntries();
    };
    return(// R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-card"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-header-row"
    }, /*#__PURE__*/ React.createElement("h3", {
        className: "scrape-ai-card__heading"
    }, "Content Entries (", totalDocs, ")"), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-filters"
    }, /*#__PURE__*/ React.createElement("select", {
        className: "scrape-ai-field__select scrape-ai-field__select--compact",
        value: filterStatus,
        onChange: (e)=>{
            setFilterStatus(e.target.value);
            setPage(1);
        }
    }, /*#__PURE__*/ React.createElement("option", {
        value: ""
    }, "All Statuses"), /*#__PURE__*/ React.createElement("option", {
        value: "synced"
    }, "Synced"), /*#__PURE__*/ React.createElement("option", {
        value: "pending"
    }, "Pending"), /*#__PURE__*/ React.createElement("option", {
        value: "error"
    }, "Error"), /*#__PURE__*/ React.createElement("option", {
        value: "error-permanent"
    }, "Permanent Error")))), deadLetterCount > 0 && /*#__PURE__*/ React.createElement(Collapsible, {
        header: `Dead Letter Queue (${deadLetterCount} permanent errors)`,
        initCollapsed: true,
        className: "scrape-ai-collapsible"
    }, /*#__PURE__*/ React.createElement("table", {
        className: "scrape-ai-table"
    }, /*#__PURE__*/ React.createElement("thead", null, /*#__PURE__*/ React.createElement("tr", null, /*#__PURE__*/ React.createElement("th", null, "Title"), /*#__PURE__*/ React.createElement("th", null, "Collection"), /*#__PURE__*/ React.createElement("th", null, "Error"), /*#__PURE__*/ React.createElement("th", null, "Retries"), /*#__PURE__*/ React.createElement("th", null, "Actions"))), /*#__PURE__*/ React.createElement("tbody", null, deadLetterEntries.map((entry)=>/*#__PURE__*/ React.createElement("tr", {
            key: entry.id
        }, /*#__PURE__*/ React.createElement("td", null, entry.title), /*#__PURE__*/ React.createElement("td", null, entry.sourceCollection), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-status--incompatible"
        }, entry.errorMessage || 'Unknown error')), /*#__PURE__*/ React.createElement("td", null, entry.retryCount), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: "secondary",
            size: "small",
            onClick: ()=>handleRegenerate([
                    entry.id
                ])
        }, "Retry"))))))), loading ? /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-loading"
    }, "Loading entries...") : /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("table", {
        className: "scrape-ai-table"
    }, /*#__PURE__*/ React.createElement("thead", null, /*#__PURE__*/ React.createElement("tr", null, /*#__PURE__*/ React.createElement("th", null, "Title"), /*#__PURE__*/ React.createElement("th", null, "Collection"), /*#__PURE__*/ React.createElement("th", null, "Status"), /*#__PURE__*/ React.createElement("th", null, "Last Synced"), /*#__PURE__*/ React.createElement("th", null, "AI"), /*#__PURE__*/ React.createElement("th", null, "Actions"))), /*#__PURE__*/ React.createElement("tbody", null, entries.map((entry)=>/*#__PURE__*/ React.createElement(React.Fragment, {
            key: entry.id
        }, /*#__PURE__*/ React.createElement("tr", {
            className: "scrape-ai-row--clickable",
            onClick: ()=>handleRowClick(entry.id)
        }, /*#__PURE__*/ React.createElement("td", null, entry.title, entry.isDraft && /*#__PURE__*/ React.createElement(Pill, {
            pillStyle: "warning",
            size: "small",
            className: "scrape-ai-inline-pill"
        }, "DRAFT")), /*#__PURE__*/ React.createElement("td", null, entry.sourceCollection), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement(Pill, {
            pillStyle: statusPillStyle[entry.status] || 'light',
            size: "small"
        }, entry.status)), /*#__PURE__*/ React.createElement("td", null, entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '\u2014'), /*#__PURE__*/ React.createElement("td", null, entry.hasAiMeta ? 'Yes' : '\u2014'), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: "secondary",
            size: "small",
            onClick: (e)=>{
                e.stopPropagation();
                handleRegenerate([
                    entry.id
                ]);
            }
        }, "Regenerate"))), selectedId === entry.id && detail && /*#__PURE__*/ React.createElement("tr", null, /*#__PURE__*/ React.createElement("td", {
            colSpan: 6,
            className: "scrape-ai-detail"
        }, /*#__PURE__*/ React.createElement("div", {
            className: "scrape-ai-detail__header"
        }, /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: viewMode === 'rendered' ? 'primary' : 'secondary',
            size: "small",
            onClick: ()=>setViewMode('rendered')
        }, "Rendered"), /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: viewMode === 'raw' ? 'primary' : 'secondary',
            size: "small",
            onClick: ()=>setViewMode('raw')
        }, "Raw Markdown")), /*#__PURE__*/ React.createElement("pre", {
            className: "scrape-ai-code"
        }, viewMode === 'raw' ? detail.markdown || 'No content' : detail.markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content'), detail.jsonLd && /*#__PURE__*/ React.createElement(Collapsible, {
            header: "JSON-LD",
            initCollapsed: true,
            className: "scrape-ai-collapsible"
        }, /*#__PURE__*/ React.createElement("pre", {
            className: "scrape-ai-code"
        }, JSON.stringify(detail.jsonLd, null, 2))), detail.aiMeta && /*#__PURE__*/ React.createElement(Collapsible, {
            header: "AI Metadata",
            initCollapsed: true,
            className: "scrape-ai-collapsible"
        }, /*#__PURE__*/ React.createElement("pre", {
            className: "scrape-ai-code"
        }, JSON.stringify(detail.aiMeta, null, 2))))))))), /*#__PURE__*/ React.createElement(Pagination, {
        page: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        onChange: setPage
    }))));
};

//# sourceMappingURL=ContentTable.js.map