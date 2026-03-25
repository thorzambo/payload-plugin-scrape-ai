'use client';
import React, { useEffect, useState } from 'react';
import { Banner, Button, CheckboxInput, Pill, SelectInput, TextInput } from '@payloadcms/ui';
const tierPillStyle = {
    budget: 'success',
    standard: 'light',
    premium: 'dark'
};
export const AiSettings = ()=>{
    const [aiEnabled, setAiEnabled] = useState(false);
    const [provider, setProvider] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [apiCallCount, setApiCallCount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [estimate, setEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);
    useEffect(()=>{
        fetchSettings();
    }, []);
    const fetchSettings = async ()=>{
        try {
            const res = await fetch('/api/scrape-ai/status', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAiEnabled(data.aiEnabled || false);
                setProvider(data.aiProvider || '');
                setModel(data.aiModel || '');
                setApiCallCount(data.aiApiCallCount || 0);
            }
        } catch  {}
    };
    const fetchEstimate = async ()=>{
        setEstimating(true);
        try {
            const params = provider ? `?provider=${provider}` : '';
            const res = await fetch(`/api/scrape-ai/token-estimate${params}`, {
                credentials: 'include'
            });
            if (res.ok) setEstimate(await res.json());
        } catch  {}
        setEstimating(false);
    };
    const handleSave = async ()=>{
        setSaving(true);
        try {
            const data = {
                aiEnabled,
                aiProvider: provider,
                aiModel: model
            };
            if (apiKey) data.aiApiKey = apiKey;
            await fetch('/api/scrape-ai/ai-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
        } finally{
            setSaving(false);
        }
    };
    const handleTest = async ()=>{
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/scrape-ai/test-ai', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.success ? `Connected! Response: "${data.response}"` : data.error
            });
        } catch (e) {
            setTestResult({
                success: false,
                message: e.message
            });
        } finally{
            setTesting(false);
        }
    };
    const handleApplyRecommendation = (modelId, modelProvider)=>{
        setModel(modelId);
        setProvider(modelProvider);
    };
    return(// R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-card"
    }, /*#__PURE__*/ React.createElement("h3", {
        className: "scrape-ai-card__heading"
    }, "AI Enrichment Settings"), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-field"
    }, /*#__PURE__*/ React.createElement(CheckboxInput, {
        checked: aiEnabled,
        onToggle: (e)=>setAiEnabled(e.target.checked),
        label: "Enable AI Enrichment",
        name: "aiEnabled"
    })), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-field"
    }, /*#__PURE__*/ React.createElement(SelectInput, {
        path: "provider",
        name: "provider",
        label: "Provider",
        value: provider,
        options: [
            {
                label: 'OpenAI',
                value: 'openai'
            },
            {
                label: 'Anthropic',
                value: 'anthropic'
            }
        ],
        onChange: (opt)=>{
            if (opt && !Array.isArray(opt)) setProvider(String(opt.value));
            else setProvider('');
        },
        placeholder: "Select provider..."
    })), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-field"
    }, /*#__PURE__*/ React.createElement("label", {
        className: "scrape-ai-field__label"
    }, "API Key"), /*#__PURE__*/ React.createElement("input", {
        type: "password",
        className: "scrape-ai-field__input",
        value: apiKey,
        onChange: (e)=>setApiKey(e.target.value),
        placeholder: "Enter API key (leave blank to keep current)"
    })), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-field"
    }, /*#__PURE__*/ React.createElement(TextInput, {
        path: "model",
        label: "Model",
        value: model,
        hasMany: false,
        onChange: (e)=>setModel(e.target.value),
        placeholder: "e.g., gpt-4.1-nano or claude-haiku-4-5-20251001"
    }), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-field__hint"
    }, "Use the token estimator below to find the best model for your content.")), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-actions"
    }, /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: "primary",
        size: "small",
        onClick: handleSave,
        disabled: saving
    }, saving ? 'Saving...' : 'Save Settings'), /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: "secondary",
        size: "small",
        onClick: handleTest,
        disabled: testing
    }, testing ? 'Testing...' : 'Test Connection')), testResult && /*#__PURE__*/ React.createElement(Banner, {
        type: testResult.success ? 'success' : 'error'
    }, testResult.message), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-stats"
    }, "API calls this month: ", /*#__PURE__*/ React.createElement("strong", null, apiCallCount)), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-estimate"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-estimate__header"
    }, /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading",
        style: {
            margin: 0
        }
    }, "Token Estimation & Model Recommendation"), /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: "primary",
        size: "small",
        onClick: fetchEstimate,
        disabled: estimating
    }, estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens')), /*#__PURE__*/ React.createElement("p", {
        className: "scrape-ai-estimate__hint"
    }, "Analyzes your content to estimate total AI tokens needed, then recommends the cheapest model that can handle your workload."), estimate && /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-mt-16"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-summary-grid"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-summary-card"
    }, /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__label"
    }, "Documents"), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__value"
    }, estimate.documentsNeedingEnrichment), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__detail"
    }, "of ", estimate.totalDocuments, " need enrichment")), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-summary-card"
    }, /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__label"
    }, "Total Tokens"), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__value"
    }, estimate.totals.formatted.totalTokens), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__detail"
    }, estimate.totals.formatted.totalInputTokens, " in / ", estimate.totals.formatted.totalOutputTokens, " out")), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-summary-card"
    }, /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__label"
    }, "Largest Request"), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__value"
    }, estimate.totals.formatted.maxSingleRequest), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__detail"
    }, "model must handle at least this")), estimate.recommendation && /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-summary-card scrape-ai-summary-card--highlight"
    }, /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__label"
    }, "Recommended"), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__value"
    }, estimate.recommendation.modelName), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-summary-card__detail"
    }, estimate.recommendation.totalCostFormatted, " total"))), estimate.recommendation && /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-recommend"
    }, /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("strong", null, "Recommended: ", estimate.recommendation.modelName), /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-recommendation__detail"
    }, "(", estimate.recommendation.provider, ") — ", estimate.recommendation.reason)), /*#__PURE__*/ React.createElement(Button, {
        type: "button",
        buttonStyle: "primary",
        size: "small",
        onClick: ()=>handleApplyRecommendation(estimate.recommendation.modelId, estimate.recommendation.provider)
    }, "Apply This Model")), /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading"
    }, "All Compatible Models"), /*#__PURE__*/ React.createElement("table", {
        className: "scrape-ai-table"
    }, /*#__PURE__*/ React.createElement("thead", null, /*#__PURE__*/ React.createElement("tr", null, /*#__PURE__*/ React.createElement("th", null, "Model"), /*#__PURE__*/ React.createElement("th", null, "Provider"), /*#__PURE__*/ React.createElement("th", null, "Tier"), /*#__PURE__*/ React.createElement("th", null, "Context"), /*#__PURE__*/ React.createElement("th", null, "Est. Cost"), /*#__PURE__*/ React.createElement("th", null, "Status"), /*#__PURE__*/ React.createElement("th", null))), /*#__PURE__*/ React.createElement("tbody", null, estimate.costEstimates.map((c)=>/*#__PURE__*/ React.createElement("tr", {
            key: c.modelId,
            className: `${!c.canHandle ? 'scrape-ai-row--disabled' : ''} ${c.recommended ? 'scrape-ai-row--recommended' : ''}`.trim()
        }, /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("strong", null, c.modelName), c.recommended && /*#__PURE__*/ React.createElement(Pill, {
            pillStyle: "success",
            size: "small",
            className: "scrape-ai-inline-pill"
        }, "BEST VALUE")), /*#__PURE__*/ React.createElement("td", null, c.provider), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement(Pill, {
            pillStyle: tierPillStyle[c.tier] || 'light',
            size: "small"
        }, c.tier)), /*#__PURE__*/ React.createElement("td", null, c.contextWindowFormatted), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("strong", null, c.totalCostFormatted)), /*#__PURE__*/ React.createElement("td", null, c.canHandle ? /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-status--compatible"
        }, c.reason || 'Compatible') : /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-status--incompatible"
        }, c.reason)), /*#__PURE__*/ React.createElement("td", null, c.canHandle && /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: "secondary",
            size: "small",
            onClick: ()=>handleApplyRecommendation(c.modelId, c.provider)
        }, "Use")))))), estimate.largestDocuments.length > 0 && /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading"
    }, "Top 10 Largest Documents"), /*#__PURE__*/ React.createElement("table", {
        className: "scrape-ai-table"
    }, /*#__PURE__*/ React.createElement("thead", null, /*#__PURE__*/ React.createElement("tr", null, /*#__PURE__*/ React.createElement("th", null, "Document"), /*#__PURE__*/ React.createElement("th", null, "Collection"), /*#__PURE__*/ React.createElement("th", null, "Content Tokens"), /*#__PURE__*/ React.createElement("th", null, "Summary"), /*#__PURE__*/ React.createElement("th", null, "Entities"), /*#__PURE__*/ React.createElement("th", null, "Chunks"))), /*#__PURE__*/ React.createElement("tbody", null, estimate.largestDocuments.map((doc, i)=>/*#__PURE__*/ React.createElement("tr", {
            key: i
        }, /*#__PURE__*/ React.createElement("td", null, doc.title), /*#__PURE__*/ React.createElement("td", null, doc.sourceCollection), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("strong", null, doc.contentTokensFormatted)), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("code", {
            className: "scrape-ai-code--inline"
        }, doc.callsBreakdown.summary)), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("code", {
            className: "scrape-ai-code--inline"
        }, doc.callsBreakdown.entities)), /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("code", {
            className: "scrape-ai-code--inline"
        }, doc.callsBreakdown.chunks)))))))))));
};

//# sourceMappingURL=AiSettings.js.map