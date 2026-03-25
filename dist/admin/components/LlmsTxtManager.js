'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@payloadcms/ui';
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
    return (_jsxs("div", { className: "scrape-ai-card", children: [_jsx("h3", { className: "scrape-ai-card__heading", children: "llms.txt Manager" }), priority.length > 0 && (_jsxs("div", { className: "scrape-ai-priority-list", children: [_jsx("h4", { className: "scrape-ai-card__subheading scrape-ai-subheading--compact", children: "Priority Order (drag to reorder)" }), priority.map((entry, i) => (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(i), onDragOver: (e) => handleDragOver(e, i), onDragEnd: handleDragEnd, className: "scrape-ai-priority-item", style: { opacity: dragIndex === i ? 0.5 : 1 }, children: [_jsx("span", { className: "scrape-ai-priority-item__handle", children: "\u2630" }), _jsx("span", { className: "scrape-ai-priority-item__slug", children: entry.slug }), _jsx("span", { className: "scrape-ai-priority-item__section", children: entry.section }), _jsxs("label", { className: "scrape-ai-priority-item__optional", children: [_jsx("input", { type: "checkbox", checked: entry.optional, onChange: () => toggleOptional(i) }), "Optional"] })] }, entry.slug))), _jsx(Button, { type: "button", buttonStyle: "primary", size: "small", onClick: handleSave, disabled: saving, className: "scrape-ai-priority-save", children: saving ? 'Saving...' : 'Save & Rebuild' })] })), _jsxs("div", { className: "scrape-ai-mt-16", children: [_jsxs("div", { className: "scrape-ai-preview-header", children: [_jsx(Button, { type: "button", buttonStyle: !showFull ? 'primary' : 'secondary', size: "small", onClick: () => setShowFull(false), children: "llms.txt" }), _jsx(Button, { type: "button", buttonStyle: showFull ? 'primary' : 'secondary', size: "small", onClick: () => setShowFull(true), children: "llms-full.txt" })] }), _jsx("pre", { className: "scrape-ai-code", children: showFull ? fullPreview || 'No content yet' : preview || 'No content yet' })] })] }));
};
//# sourceMappingURL=LlmsTxtManager.js.map