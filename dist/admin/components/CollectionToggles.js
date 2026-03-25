'use client';
import React, { useEffect, useState } from 'react';
import { Pill, ShimmerEffect } from '@payloadcms/ui';
export const CollectionToggles = ()=>{
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchCollections = async ()=>{
        try {
            const res = await fetch('/api/scrape-ai/detected-collections', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setCollections(data.collections || []);
            }
        } catch  {} finally{
            setLoading(false);
        }
    };
    useEffect(()=>{
        fetchCollections();
    }, []);
    const handleToggle = async (slug, enabled)=>{
        setCollections((prev)=>prev.map((c)=>c.slug === slug ? {
                    ...c,
                    enabled
                } : c));
        await fetch('/api/scrape-ai/toggle-collection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                collection: slug,
                enabled
            })
        });
    };
    if (loading) return /*#__PURE__*/ React.createElement(ShimmerEffect, null);
    return(// R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-card"
    }, /*#__PURE__*/ React.createElement("h3", {
        className: "scrape-ai-card__heading"
    }, "Collection Toggles"), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-toggles"
    }, collections.map((c)=>/*#__PURE__*/ React.createElement("div", {
            key: c.slug,
            className: "scrape-ai-toggle-row"
        }, /*#__PURE__*/ React.createElement("div", {
            className: "scrape-ai-toggle-row__info"
        }, /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-toggle-row__name"
        }, c.label || c.slug), /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-toggle-row__count"
        }, c.docCount, " documents")), /*#__PURE__*/ React.createElement(Pill, {
            pillStyle: c.enabled ? 'success' : 'light-gray',
            onClick: ()=>handleToggle(c.slug, !c.enabled)
        }, c.enabled ? 'Enabled' : 'Disabled'))))));
};

//# sourceMappingURL=CollectionToggles.js.map