'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
    useEffect(() => {
        fetchSettings();
    }, []);
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
            if (res.ok) {
                setEstimate(await res.json());
            }
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
            await fetch('/api/scrape-ai/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/scrape-ai/test-ai', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.success ? `Connected! Response: "${data.response}"` : data.error,
            });
        }
        catch (e) {
            setTestResult({ success: false, message: e.message });
        }
        finally {
            setTesting(false);
        }
    };
    const handleApplyRecommendation = (modelId, modelProvider) => {
        setModel(modelId);
        setProvider(modelProvider);
    };
    const tierColors = {
        budget: '#22c55e',
        standard: '#3b82f6',
        premium: '#8b5cf6',
    };
    return (_jsxs("div", { style: styles.container, children: [_jsx("h3", { style: styles.heading, children: "AI Enrichment Settings" }), _jsx("div", { style: styles.field, children: _jsxs("label", { style: styles.label, children: [_jsx("input", { type: "checkbox", checked: aiEnabled, onChange: (e) => setAiEnabled(e.target.checked), style: styles.checkbox }), "Enable AI Enrichment"] }) }), _jsxs("div", { style: styles.field, children: [_jsx("label", { style: styles.label, children: "Provider" }), _jsxs("select", { style: styles.input, value: provider, onChange: (e) => setProvider(e.target.value), children: [_jsx("option", { value: "", children: "Select provider..." }), _jsx("option", { value: "openai", children: "OpenAI" }), _jsx("option", { value: "anthropic", children: "Anthropic" })] })] }), _jsxs("div", { style: styles.field, children: [_jsx("label", { style: styles.label, children: "API Key" }), _jsx("input", { type: "password", style: styles.input, value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "Enter API key (leave blank to keep current)" })] }), _jsxs("div", { style: styles.field, children: [_jsx("label", { style: styles.label, children: "Model" }), _jsx("input", { type: "text", style: styles.input, value: model, onChange: (e) => setModel(e.target.value), placeholder: "e.g., gpt-4.1-nano or claude-haiku-4-5-20251001" }), _jsx("span", { style: styles.hint, children: "Use the token estimator below to find the best model for your content." })] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { style: styles.saveButton, onClick: handleSave, disabled: saving, children: saving ? 'Saving...' : 'Save Settings' }), _jsx("button", { style: styles.testButton, onClick: handleTest, disabled: testing, children: testing ? 'Testing...' : 'Test Connection' })] }), testResult && (_jsx("div", { style: {
                    ...styles.testResult,
                    backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
                    color: testResult.success ? '#166534' : '#991b1b',
                }, children: testResult.message })), _jsxs("div", { style: styles.stats, children: ["API calls this month: ", _jsx("strong", { children: apiCallCount })] }), _jsxs("div", { style: styles.estimateSection, children: [_jsxs("div", { style: styles.estimateHeader, children: [_jsx("h4", { style: styles.subheading, children: "Token Estimation & Model Recommendation" }), _jsx("button", { style: styles.estimateButton, onClick: fetchEstimate, disabled: estimating, children: estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens' })] }), _jsx("p", { style: styles.estimateHint, children: "Analyzes your content to estimate total AI tokens needed, then recommends the cheapest model that can handle your workload." }), estimate && (_jsxs("div", { style: styles.estimateResults, children: [_jsxs("div", { style: styles.summaryGrid, children: [_jsxs("div", { style: styles.summaryCard, children: [_jsx("span", { style: styles.summaryLabel, children: "Documents" }), _jsx("span", { style: styles.summaryValue, children: estimate.documentsNeedingEnrichment }), _jsxs("span", { style: styles.summaryDetail, children: ["of ", estimate.totalDocuments, " need enrichment"] })] }), _jsxs("div", { style: styles.summaryCard, children: [_jsx("span", { style: styles.summaryLabel, children: "Total Tokens" }), _jsx("span", { style: styles.summaryValue, children: estimate.totals.formatted.totalTokens }), _jsxs("span", { style: styles.summaryDetail, children: [estimate.totals.formatted.totalInputTokens, " in / ", estimate.totals.formatted.totalOutputTokens, " out"] })] }), _jsxs("div", { style: styles.summaryCard, children: [_jsx("span", { style: styles.summaryLabel, children: "Largest Request" }), _jsx("span", { style: styles.summaryValue, children: estimate.totals.formatted.maxSingleRequest }), _jsx("span", { style: styles.summaryDetail, children: "model must handle at least this" })] }), estimate.recommendation && (_jsxs("div", { style: { ...styles.summaryCard, borderColor: '#22c55e', borderWidth: '2px' }, children: [_jsx("span", { style: styles.summaryLabel, children: "Recommended" }), _jsx("span", { style: styles.summaryValue, children: estimate.recommendation.modelName }), _jsxs("span", { style: styles.summaryDetail, children: [estimate.recommendation.totalCostFormatted, " total"] })] }))] }), estimate.recommendation && (_jsxs("div", { style: styles.recommendBanner, children: [_jsxs("div", { children: [_jsxs("strong", { children: ["Recommended: ", estimate.recommendation.modelName] }), _jsxs("span", { style: { marginLeft: '8px', color: '#666' }, children: ["(", estimate.recommendation.provider, ") \u2014 ", estimate.recommendation.reason] })] }), _jsx("button", { style: styles.applyButton, onClick: () => handleApplyRecommendation(estimate.recommendation.modelId, estimate.recommendation.provider), children: "Apply This Model" })] })), _jsx("h4", { style: styles.subheading, children: "All Compatible Models" }), _jsxs("table", { style: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: styles.th, children: "Model" }), _jsx("th", { style: styles.th, children: "Provider" }), _jsx("th", { style: styles.th, children: "Tier" }), _jsx("th", { style: styles.th, children: "Context" }), _jsx("th", { style: styles.th, children: "Est. Cost" }), _jsx("th", { style: styles.th, children: "Status" }), _jsx("th", { style: styles.th })] }) }), _jsx("tbody", { children: estimate.costEstimates.map((c) => (_jsxs("tr", { style: {
                                                ...styles.tr,
                                                opacity: c.canHandle ? 1 : 0.5,
                                                backgroundColor: c.recommended ? '#f0fdf4' : 'transparent',
                                            }, children: [_jsxs("td", { style: styles.td, children: [_jsx("strong", { children: c.modelName }), c.recommended && _jsx("span", { style: styles.recommendBadge, children: "BEST VALUE" })] }), _jsx("td", { style: styles.td, children: c.provider }), _jsx("td", { style: styles.td, children: _jsx("span", { style: { ...styles.tierBadge, backgroundColor: tierColors[c.tier] || '#999' }, children: c.tier }) }), _jsx("td", { style: styles.td, children: c.contextWindowFormatted }), _jsx("td", { style: styles.td, children: _jsx("strong", { children: c.totalCostFormatted }) }), _jsx("td", { style: styles.td, children: c.canHandle ? (_jsx("span", { style: { color: '#22c55e' }, children: c.reason || 'Compatible' })) : (_jsx("span", { style: { color: '#ef4444' }, children: c.reason })) }), _jsx("td", { style: styles.td, children: c.canHandle && (_jsx("button", { style: styles.useButton, onClick: () => handleApplyRecommendation(c.modelId, c.provider), children: "Use" })) })] }, c.modelId))) })] }), estimate.largestDocuments.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h4", { style: styles.subheading, children: "Top 10 Largest Documents" }), _jsxs("table", { style: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: styles.th, children: "Document" }), _jsx("th", { style: styles.th, children: "Collection" }), _jsx("th", { style: styles.th, children: "Content Tokens" }), _jsx("th", { style: styles.th, children: "Summary Call" }), _jsx("th", { style: styles.th, children: "Entities Call" }), _jsx("th", { style: styles.th, children: "Chunks Call" })] }) }), _jsx("tbody", { children: estimate.largestDocuments.map((doc, i) => (_jsxs("tr", { style: styles.tr, children: [_jsx("td", { style: styles.td, children: doc.title }), _jsx("td", { style: styles.td, children: doc.sourceCollection }), _jsx("td", { style: styles.td, children: _jsx("strong", { children: doc.contentTokensFormatted }) }), _jsx("td", { style: styles.td, children: _jsx("code", { style: styles.code, children: doc.callsBreakdown.summary }) }), _jsx("td", { style: styles.td, children: _jsx("code", { style: styles.code, children: doc.callsBreakdown.entities }) }), _jsx("td", { style: styles.td, children: _jsx("code", { style: styles.code, children: doc.callsBreakdown.chunks }) })] }, i))) })] })] }))] }))] })] }));
};
const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-0, white)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    },
    heading: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 },
    subheading: { margin: '20px 0 10px 0', fontSize: '14px', fontWeight: 600 },
    field: { marginBottom: '12px' },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        marginBottom: '4px',
        fontWeight: 500,
    },
    checkbox: { width: '18px', height: '18px' },
    input: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    hint: {
        fontSize: '12px',
        color: 'var(--theme-elevation-400, #999)',
        marginTop: '4px',
        display: 'block',
    },
    actions: { display: 'flex', gap: '8px', marginTop: '16px' },
    saveButton: {
        padding: '8px 16px',
        backgroundColor: 'var(--theme-elevation-900, #333)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    },
    testButton: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        border: '1px solid var(--theme-elevation-300, #ccc)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    },
    testResult: {
        marginTop: '12px',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '13px',
    },
    stats: {
        marginTop: '16px',
        padding: '10px 14px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '6px',
        fontSize: '13px',
    },
    estimateSection: {
        marginTop: '24px',
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-50, #fafafa)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e8e8e8)',
    },
    estimateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    estimateButton: {
        padding: '8px 16px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
    },
    estimateHint: {
        fontSize: '13px',
        color: 'var(--theme-elevation-500, #777)',
        margin: '8px 0 0 0',
    },
    estimateResults: { marginTop: '16px' },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
    },
    summaryCard: {
        padding: '14px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    summaryLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#888' },
    summaryValue: { fontSize: '22px', fontWeight: 700 },
    summaryDetail: { fontSize: '12px', color: '#999' },
    recommendBanner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
    },
    applyButton: {
        padding: '6px 14px',
        backgroundColor: '#22c55e',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: {
        textAlign: 'left',
        padding: '8px 10px',
        borderBottom: '2px solid var(--theme-elevation-100, #e0e0e0)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#888',
    },
    tr: { borderBottom: '1px solid var(--theme-elevation-50, #f0f0f0)' },
    td: { padding: '8px 10px', fontSize: '13px' },
    recommendBadge: {
        marginLeft: '8px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: '#22c55e',
        color: 'white',
        fontSize: '10px',
        fontWeight: 700,
    },
    tierBadge: {
        padding: '2px 8px',
        borderRadius: '4px',
        color: 'white',
        fontSize: '11px',
        fontWeight: 600,
    },
    useButton: {
        padding: '4px 10px',
        fontSize: '12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    code: { fontSize: '11px', fontFamily: 'monospace', color: '#666' },
};
//# sourceMappingURL=AiSettings.js.map