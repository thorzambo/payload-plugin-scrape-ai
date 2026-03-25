'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@payloadcms/ui';
export const LlmsTxtManager = ()=>{
    const [priority, setPriority] = useState([]);
    const [sections, setSections] = useState([]);
    const [preview, setPreview] = useState('');
    const [showFull, setShowFull] = useState(false);
    const [fullPreview, setFullPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    useEffect(()=>{
        fetchConfig();
        fetchPreview();
    }, []);
    const fetchConfig = async ()=>{
        try {
            const res = await fetch('/api/scrape-ai/llms-txt-config', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setPriority(data.priority || []);
                setSections(data.sections || []);
            }
        } catch  {}
    };
    const fetchPreview = async ()=>{
        try {
            const [llmsRes, fullRes] = await Promise.all([
                fetch('/api/llms.txt'),
                fetch('/api/llms-full.txt')
            ]);
            if (llmsRes.ok) setPreview(await llmsRes.text());
            if (fullRes.ok) setFullPreview(await fullRes.text());
        } catch  {}
    };
    const handleSave = async ()=>{
        setSaving(true);
        try {
            await fetch('/api/scrape-ai/llms-txt-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    priority,
                    sections
                })
            });
            // Re-fetch preview after rebuild
            setTimeout(fetchPreview, 2000);
        } finally{
            setSaving(false);
        }
    };
    const handleDragStart = (index)=>setDragIndex(index);
    const handleDragOver = (e, index)=>{
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        const newPriority = [
            ...priority
        ];
        const item = newPriority.splice(dragIndex, 1)[0];
        newPriority.splice(index, 0, item);
        setPriority(newPriority);
        setDragIndex(index);
    };
    const handleDragEnd = ()=>setDragIndex(null);
    const toggleOptional = (index)=>{
        const newPriority = [
            ...priority
        ];
        newPriority[index] = {
            ...newPriority[index],
            optional: !newPriority[index].optional
        };
        setPriority(newPriority);
    };
    return(// R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-card"
    }, /*#__PURE__*/ React.createElement("h3", {
        className: "scrape-ai-card__heading"
    }, "llms.txt Manager"), priority.length > 0 && /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-priority-list"
    }, /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading scrape-ai-subheading--compact"
    }, "Priority Order (drag to reorder)"), priority.map((entry, i)=>/*#__PURE__*/ React.createElement("div", {
            key: entry.slug,
            draggable: true,
            onDragStart: ()=>handleDragStart(i),
            onDragOver: (e)=>handleDragOver(e, i),
            onDragEnd: handleDragEnd,
            className: "scrape-ai-priority-item",
            style: {
                opacity: dragIndex === i ? 0.5 : 1
            }
        }, /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-priority-item__handle"
        }, "☰"), /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-priority-item__slug"
        }, entry.slug), /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-priority-item__section"
        }, entry.section), /*#__PURE__*/ React.createElement("label", {
            className: "scrape-ai-priority-item__optional"
        }, /*#__PURE__*/ React.createElement("input", {
            type: "checkbox",
            checked: entry.optional,
            onChange: ()=>toggleOptional(i)
        }), "Optional"))), /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: "primary",
        size: "small",
        onClick: handleSave,
        disabled: saving,
        className: "scrape-ai-priority-save"
    }, saving ? 'Saving...' : 'Save & Rebuild')), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-mt-16"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-preview-header"
    }, /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: !showFull ? 'primary' : 'secondary',
        size: "small",
        onClick: ()=>setShowFull(false)
    }, "llms.txt"), /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: showFull ? 'primary' : 'secondary',
        size: "small",
        onClick: ()=>setShowFull(true)
    }, "llms-full.txt")), /*#__PURE__*/ React.createElement("pre", {
        className: "scrape-ai-code"
    }, showFull ? fullPreview || 'No content yet' : preview || 'No content yet'))));
};

//# sourceMappingURL=LlmsTxtManager.js.map