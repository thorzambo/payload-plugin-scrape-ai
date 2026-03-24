'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const LlmsTxtManager = () => {
    const [priority, setPriority] = useState([]);
    const [sections, setSections] = useState([]);
    const [preview, setPreview] = useState('');
    const [showFull, setShowFull] = useState(false);
    const [fullPreview, setFullPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    useEffect(() => {
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
    return (_jsxs("div", { style: styles.container, children: [_jsx("h3", { style: styles.heading, children: "llms.txt Manager" }), priority.length > 0 && (_jsxs("div", { style: styles.priorityList, children: [_jsx("h4", { style: styles.subheading, children: "Priority Order (drag to reorder)" }), priority.map((entry, i) => (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(i), onDragOver: (e) => handleDragOver(e, i), onDragEnd: handleDragEnd, style: {
                            ...styles.priorityItem,
                            opacity: dragIndex === i ? 0.5 : 1,
                        }, children: [_jsx("span", { style: styles.dragHandle, children: "\u2630" }), _jsx("span", { style: styles.entrySlug, children: entry.slug }), _jsx("span", { style: styles.entrySection, children: entry.section }), _jsxs("label", { style: styles.optionalLabel, children: [_jsx("input", { type: "checkbox", checked: entry.optional, onChange: () => toggleOptional(i) }), "Optional"] })] }, entry.slug))), _jsx("button", { style: styles.saveButton, onClick: handleSave, disabled: saving, children: saving ? 'Saving...' : 'Save & Rebuild' })] })), _jsxs("div", { style: styles.previewSection, children: [_jsxs("div", { style: styles.previewHeader, children: [_jsx("button", { style: !showFull ? styles.activeTab : styles.tab, onClick: () => setShowFull(false), children: "llms.txt" }), _jsx("button", { style: showFull ? styles.activeTab : styles.tab, onClick: () => setShowFull(true), children: "llms-full.txt" })] }), _jsx("pre", { style: styles.previewContent, children: showFull ? fullPreview || 'No content yet' : preview || 'No content yet' })] })] }));
};
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
        backgroundColor: '#2563eb',
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
        border: '1px solid #2563eb',
        borderRadius: '4px',
        backgroundColor: '#2563eb',
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