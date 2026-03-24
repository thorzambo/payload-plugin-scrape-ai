"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmsTxtManager = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const LlmsTxtManager = () => {
    const [priority, setPriority] = (0, react_1.useState)([]);
    const [sections, setSections] = (0, react_1.useState)([]);
    const [preview, setPreview] = (0, react_1.useState)('');
    const [showFull, setShowFull] = (0, react_1.useState)(false);
    const [fullPreview, setFullPreview] = (0, react_1.useState)('');
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [dragIndex, setDragIndex] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchConfig();
        fetchPreview();
    }, []);
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/scrape-ai/llms-txt-config', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPriority(data.priority || []);
                setSections(data.sections || []);
            }
        }
        catch { }
    };
    const fetchPreview = async () => {
        try {
            const [llmsRes, fullRes] = await Promise.all([
                fetch('/api/llms.txt'),
                fetch('/api/llms-full.txt'),
            ]);
            if (llmsRes.ok)
                setPreview(await llmsRes.text());
            if (fullRes.ok)
                setFullPreview(await fullRes.text());
        }
        catch { }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/scrape-ai/llms-txt-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ priority, sections }),
            });
            // Re-fetch preview after rebuild
            setTimeout(fetchPreview, 2000);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDragStart = (index) => setDragIndex(index);
    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index)
            return;
        const newPriority = [...priority];
        const item = newPriority.splice(dragIndex, 1)[0];
        newPriority.splice(index, 0, item);
        setPriority(newPriority);
        setDragIndex(index);
    };
    const handleDragEnd = () => setDragIndex(null);
    const toggleOptional = (index) => {
        const newPriority = [...priority];
        newPriority[index] = { ...newPriority[index], optional: !newPriority[index].optional };
        setPriority(newPriority);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsx)("h3", { style: styles.heading, children: "llms.txt Manager" }), priority.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { style: styles.priorityList, children: [(0, jsx_runtime_1.jsx)("h4", { style: styles.subheading, children: "Priority Order (drag to reorder)" }), priority.map((entry, i) => ((0, jsx_runtime_1.jsxs)("div", { draggable: true, onDragStart: () => handleDragStart(i), onDragOver: (e) => handleDragOver(e, i), onDragEnd: handleDragEnd, style: {
                            ...styles.priorityItem,
                            opacity: dragIndex === i ? 0.5 : 1,
                        }, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.dragHandle, children: "\u2630" }), (0, jsx_runtime_1.jsx)("span", { style: styles.entrySlug, children: entry.slug }), (0, jsx_runtime_1.jsx)("span", { style: styles.entrySection, children: entry.section }), (0, jsx_runtime_1.jsxs)("label", { style: styles.optionalLabel, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: entry.optional, onChange: () => toggleOptional(i) }), "Optional"] })] }, entry.slug))), (0, jsx_runtime_1.jsx)("button", { style: styles.saveButton, onClick: handleSave, disabled: saving, children: saving ? 'Saving...' : 'Save & Rebuild' })] })), (0, jsx_runtime_1.jsxs)("div", { style: styles.previewSection, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.previewHeader, children: [(0, jsx_runtime_1.jsx)("button", { style: !showFull ? styles.activeTab : styles.tab, onClick: () => setShowFull(false), children: "llms.txt" }), (0, jsx_runtime_1.jsx)("button", { style: showFull ? styles.activeTab : styles.tab, onClick: () => setShowFull(true), children: "llms-full.txt" })] }), (0, jsx_runtime_1.jsx)("pre", { style: styles.previewContent, children: showFull ? fullPreview || 'No content yet' : preview || 'No content yet' })] })] }));
};
exports.LlmsTxtManager = LlmsTxtManager;
const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-0, white)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    },
    heading: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 },
    subheading: { margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 },
    priorityList: { marginBottom: '20px' },
    priorityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        marginBottom: '4px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '4px',
        cursor: 'grab',
    },
    dragHandle: { fontSize: '14px', cursor: 'grab', color: '#999' },
    entrySlug: { flex: 1, fontSize: '13px', fontFamily: 'monospace' },
    entrySection: { fontSize: '12px', color: '#888' },
    optionalLabel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    saveButton: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: 'var(--theme-elevation-900, #333)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    },
    previewSection: { marginTop: '16px' },
    previewHeader: { display: 'flex', gap: '8px', marginBottom: '12px' },
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
    previewContent: {
        padding: '16px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '6px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '500px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
    },
};
//# sourceMappingURL=LlmsTxtManager.js.map