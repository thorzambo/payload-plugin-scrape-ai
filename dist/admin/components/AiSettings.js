'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button, CheckboxInput, Pill, SelectInput, TextInput } from '@payloadcms/ui';
const tierPillStyle = {
    budget: 'success',
    standard: 'light',
    premium: 'dark',
};
export const AiSettings = () => {
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
    useEffect(() => { fetchSettings(); }, []);
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/scrape-ai/status', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setAiEnabled(data.aiEnabled || false);
                setProvider(data.aiProvider || '');
                setModel(data.aiModel || '');
                setApiCallCount(data.aiApiCallCount || 0);
            }
        }
        catch { }
    };
    const fetchEstimate = async () => {
        setEstimating(true);
        try {
            const params = provider ? `?provider=${provider}` : '';
            const res = await fetch(`/api/scrape-ai/token-estimate${params}`, { credentials: 'include' });
            if (res.ok)
                setEstimate(await res.json());
        }
        catch { }
        setEstimating(false);
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            const data = { aiEnabled, aiProvider: provider, aiModel: model };
            if (apiKey)
                data.aiApiKey = apiKey;
            await fetch('/api/scrape-ai/ai-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) });
        }
        finally {
            setSaving(false);
        }
    };
    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/scrape-ai/test-ai', { method: 'POST', credentials: 'include' });
            const data = await res.json();
            setTestResult({ success: data.success, message: data.success ? `Connected! Response: "${data.response}"` : data.error });
        }
        catch (e) {
            setTestResult({ success: false, message: e.message });
        }
        finally {
            setTesting(false);
        }
    };
    const handleApplyRecommendation = (modelId, modelProvider) => { setModel(modelId); setProvider(modelProvider); };
    return (_jsxs("div", { className: "scrape-ai-card", children: [_jsx("h3", { className: "scrape-ai-card__heading", children: "AI Enrichment Settings" }), _jsx("div", { className: "scrape-ai-field", children: _jsx(CheckboxInput, { checked: aiEnabled, onToggle: (e) => setAiEnabled(e.target.checked), label: "Enable AI Enrichment", name: "aiEnabled" }) }), _jsx("div", { className: "scrape-ai-field", children: _jsx(SelectInput, { path: "provider", name: "provider", label: "Provider", value: provider, options: [
                        { label: 'OpenAI', value: 'openai' },
                        { label: 'Anthropic', value: 'anthropic' },
                    ], onChange: (opt) => {
                        if (opt && !Array.isArray(opt))
                            setProvider(String(opt.value));
                        else
                            setProvider('');
                    }, placeholder: "Select provider..." }) }), _jsxs("div", { className: "scrape-ai-field", children: [_jsx("label", { className: "scrape-ai-field__label", children: "API Key" }), _jsx("input", { type: "password", className: "scrape-ai-field__input", value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "Enter API key (leave blank to keep current)" })] }), _jsxs("div", { className: "scrape-ai-field", children: [_jsx(TextInput, { path: "model", label: "Model", value: model, hasMany: false, onChange: (e) => setModel(e.target.value), placeholder: "e.g., gpt-4.1-nano or claude-haiku-4-5-20251001" }), _jsx("span", { className: "scrape-ai-field__hint", children: "Use the token estimator below to find the best model for your content." })] }), _jsxs("div", { className: "scrape-ai-actions", children: [_jsx(Button, { type: "button", buttonStyle: "primary", size: "small", onClick: handleSave, disabled: saving, children: saving ? 'Saving...' : 'Save Settings' }), _jsx(Button, { type: "button", buttonStyle: "secondary", size: "small", onClick: handleTest, disabled: testing, children: testing ? 'Testing...' : 'Test Connection' })] }), testResult && (_jsx("div", { className: `scrape-ai-alert ${testResult.success ? 'scrape-ai-alert--success' : 'scrape-ai-alert--error'}`, children: testResult.message })), _jsxs("div", { className: "scrape-ai-stats", children: ["API calls this month: ", _jsx("strong", { children: apiCallCount })] }), _jsxs("div", { className: "scrape-ai-estimate", children: [_jsxs("div", { className: "scrape-ai-estimate__header", children: [_jsx("h4", { className: "scrape-ai-card__subheading", style: { margin: 0 }, children: "Token Estimation & Model Recommendation" }), _jsx(Button, { type: "button", buttonStyle: "primary", size: "small", onClick: fetchEstimate, disabled: estimating, children: estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens' })] }), _jsx("p", { className: "scrape-ai-estimate__hint", children: "Analyzes your content to estimate total AI tokens needed, then recommends the cheapest model that can handle your workload." }), estimate && (_jsxs("div", { className: "scrape-ai-mt-16", children: [_jsxs("div", { className: "scrape-ai-summary-grid", children: [_jsxs("div", { className: "scrape-ai-summary-card", children: [_jsx("span", { className: "scrape-ai-summary-card__label", children: "Documents" }), _jsx("span", { className: "scrape-ai-summary-card__value", children: estimate.documentsNeedingEnrichment }), _jsxs("span", { className: "scrape-ai-summary-card__detail", children: ["of ", estimate.totalDocuments, " need enrichment"] })] }), _jsxs("div", { className: "scrape-ai-summary-card", children: [_jsx("span", { className: "scrape-ai-summary-card__label", children: "Total Tokens" }), _jsx("span", { className: "scrape-ai-summary-card__value", children: estimate.totals.formatted.totalTokens }), _jsxs("span", { className: "scrape-ai-summary-card__detail", children: [estimate.totals.formatted.totalInputTokens, " in / ", estimate.totals.formatted.totalOutputTokens, " out"] })] }), _jsxs("div", { className: "scrape-ai-summary-card", children: [_jsx("span", { className: "scrape-ai-summary-card__label", children: "Largest Request" }), _jsx("span", { className: "scrape-ai-summary-card__value", children: estimate.totals.formatted.maxSingleRequest }), _jsx("span", { className: "scrape-ai-summary-card__detail", children: "model must handle at least this" })] }), estimate.recommendation && (_jsxs("div", { className: "scrape-ai-summary-card scrape-ai-summary-card--highlight", children: [_jsx("span", { className: "scrape-ai-summary-card__label", children: "Recommended" }), _jsx("span", { className: "scrape-ai-summary-card__value", children: estimate.recommendation.modelName }), _jsxs("span", { className: "scrape-ai-summary-card__detail", children: [estimate.recommendation.totalCostFormatted, " total"] })] }))] }), estimate.recommendation && (_jsxs("div", { className: "scrape-ai-recommend", children: [_jsxs("div", { children: [_jsxs("strong", { children: ["Recommended: ", estimate.recommendation.modelName] }), _jsxs("span", { className: "scrape-ai-recommendation__detail", children: ["(", estimate.recommendation.provider, ") \u2014 ", estimate.recommendation.reason] })] }), _jsx(Button, { type: "button", buttonStyle: "primary", size: "small", onClick: () => handleApplyRecommendation(estimate.recommendation.modelId, estimate.recommendation.provider), children: "Apply This Model" })] })), _jsx("h4", { className: "scrape-ai-card__subheading", children: "All Compatible Models" }), _jsxs("table", { className: "scrape-ai-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Model" }), _jsx("th", { children: "Provider" }), _jsx("th", { children: "Tier" }), _jsx("th", { children: "Context" }), _jsx("th", { children: "Est. Cost" }), _jsx("th", { children: "Status" }), _jsx("th", {})] }) }), _jsx("tbody", { children: estimate.costEstimates.map((c) => (_jsxs("tr", { className: `${!c.canHandle ? 'scrape-ai-row--disabled' : ''} ${c.recommended ? 'scrape-ai-row--recommended' : ''}`.trim(), children: [_jsxs("td", { children: [_jsx("strong", { children: c.modelName }), c.recommended && _jsx(Pill, { pillStyle: "success", size: "small", className: "scrape-ai-inline-pill", children: "BEST VALUE" })] }), _jsx("td", { children: c.provider }), _jsx("td", { children: _jsx(Pill, { pillStyle: tierPillStyle[c.tier] || 'light', size: "small", children: c.tier }) }), _jsx("td", { children: c.contextWindowFormatted }), _jsx("td", { children: _jsx("strong", { children: c.totalCostFormatted }) }), _jsx("td", { children: c.canHandle ? _jsx("span", { className: "scrape-ai-status--compatible", children: c.reason || 'Compatible' }) : _jsx("span", { className: "scrape-ai-status--incompatible", children: c.reason }) }), _jsx("td", { children: c.canHandle && _jsx(Button, { type: "button", buttonStyle: "secondary", size: "small", onClick: () => handleApplyRecommendation(c.modelId, c.provider), children: "Use" }) })] }, c.modelId))) })] }), estimate.largestDocuments.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h4", { className: "scrape-ai-card__subheading", children: "Top 10 Largest Documents" }), _jsxs("table", { className: "scrape-ai-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Document" }), _jsx("th", { children: "Collection" }), _jsx("th", { children: "Content Tokens" }), _jsx("th", { children: "Summary" }), _jsx("th", { children: "Entities" }), _jsx("th", { children: "Chunks" })] }) }), _jsx("tbody", { children: estimate.largestDocuments.map((doc, i) => (_jsxs("tr", { children: [_jsx("td", { children: doc.title }), _jsx("td", { children: doc.sourceCollection }), _jsx("td", { children: _jsx("strong", { children: doc.contentTokensFormatted }) }), _jsx("td", { children: _jsx("code", { className: "scrape-ai-code--inline", children: doc.callsBreakdown.summary }) }), _jsx("td", { children: _jsx("code", { className: "scrape-ai-code--inline", children: doc.callsBreakdown.entities }) }), _jsx("td", { children: _jsx("code", { className: "scrape-ai-code--inline", children: doc.callsBreakdown.chunks }) })] }, i))) })] })] }))] }))] })] }));
};
//# sourceMappingURL=AiSettings.js.map