"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AiSettings = () => {
    const [aiEnabled, setAiEnabled] = (0, react_1.useState)(false);
    const [provider, setProvider] = (0, react_1.useState)('');
    const [apiKey, setApiKey] = (0, react_1.useState)('');
    const [model, setModel] = (0, react_1.useState)('');
    const [apiCallCount, setApiCallCount] = (0, react_1.useState)(0);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [testing, setTesting] = (0, react_1.useState)(false);
    const [testResult, setTestResult] = (0, react_1.useState)(null);
    const [estimate, setEstimate] = (0, react_1.useState)(null);
    const [estimating, setEstimating] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsx)("h3", { style: styles.heading, children: "AI Enrichment Settings" }), (0, jsx_runtime_1.jsx)("div", { style: styles.field, children: (0, jsx_runtime_1.jsxs)("label", { style: styles.label, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: aiEnabled, onChange: (e) => setAiEnabled(e.target.checked), style: styles.checkbox }), "Enable AI Enrichment"] }) }), (0, jsx_runtime_1.jsxs)("div", { style: styles.field, children: [(0, jsx_runtime_1.jsx)("label", { style: styles.label, children: "Provider" }), (0, jsx_runtime_1.jsxs)("select", { style: styles.input, value: provider, onChange: (e) => setProvider(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select provider..." }), (0, jsx_runtime_1.jsx)("option", { value: "openai", children: "OpenAI" }), (0, jsx_runtime_1.jsx)("option", { value: "anthropic", children: "Anthropic" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.field, children: [(0, jsx_runtime_1.jsx)("label", { style: styles.label, children: "API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", style: styles.input, value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "Enter API key (leave blank to keep current)" })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.field, children: [(0, jsx_runtime_1.jsx)("label", { style: styles.label, children: "Model" }), (0, jsx_runtime_1.jsx)("input", { type: "text", style: styles.input, value: model, onChange: (e) => setModel(e.target.value), placeholder: "e.g., gpt-4.1-nano or claude-haiku-4-5-20251001" }), (0, jsx_runtime_1.jsx)("span", { style: styles.hint, children: "Use the token estimator below to find the best model for your content." })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.actions, children: [(0, jsx_runtime_1.jsx)("button", { style: styles.saveButton, onClick: handleSave, disabled: saving, children: saving ? 'Saving...' : 'Save Settings' }), (0, jsx_runtime_1.jsx)("button", { style: styles.testButton, onClick: handleTest, disabled: testing, children: testing ? 'Testing...' : 'Test Connection' })] }), testResult && ((0, jsx_runtime_1.jsx)("div", { style: {
                    ...styles.testResult,
                    backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
                    color: testResult.success ? '#166534' : '#991b1b',
                }, children: testResult.message })), (0, jsx_runtime_1.jsxs)("div", { style: styles.stats, children: ["API calls this month: ", (0, jsx_runtime_1.jsx)("strong", { children: apiCallCount })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.estimateSection, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.estimateHeader, children: [(0, jsx_runtime_1.jsx)("h4", { style: styles.subheading, children: "Token Estimation & Model Recommendation" }), (0, jsx_runtime_1.jsx)("button", { style: styles.estimateButton, onClick: fetchEstimate, disabled: estimating, children: estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens' })] }), (0, jsx_runtime_1.jsx)("p", { style: styles.estimateHint, children: "Analyzes your content to estimate total AI tokens needed, then recommends the cheapest model that can handle your workload." }), estimate && ((0, jsx_runtime_1.jsxs)("div", { style: styles.estimateResults, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.summaryGrid, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.summaryCard, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.summaryLabel, children: "Documents" }), (0, jsx_runtime_1.jsx)("span", { style: styles.summaryValue, children: estimate.documentsNeedingEnrichment }), (0, jsx_runtime_1.jsxs)("span", { style: styles.summaryDetail, children: ["of ", estimate.totalDocuments, " need enrichment"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.summaryCard, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.summaryLabel, children: "Total Tokens" }), (0, jsx_runtime_1.jsx)("span", { style: styles.summaryValue, children: estimate.totals.formatted.totalTokens }), (0, jsx_runtime_1.jsxs)("span", { style: styles.summaryDetail, children: [estimate.totals.formatted.totalInputTokens, " in / ", estimate.totals.formatted.totalOutputTokens, " out"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.summaryCard, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.summaryLabel, children: "Largest Request" }), (0, jsx_runtime_1.jsx)("span", { style: styles.summaryValue, children: estimate.totals.formatted.maxSingleRequest }), (0, jsx_runtime_1.jsx)("span", { style: styles.summaryDetail, children: "model must handle at least this" })] }), estimate.recommendation && ((0, jsx_runtime_1.jsxs)("div", { style: { ...styles.summaryCard, borderColor: '#22c55e', borderWidth: '2px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.summaryLabel, children: "Recommended" }), (0, jsx_runtime_1.jsx)("span", { style: styles.summaryValue, children: estimate.recommendation.modelName }), (0, jsx_runtime_1.jsxs)("span", { style: styles.summaryDetail, children: [estimate.recommendation.totalCostFormatted, " total"] })] }))] }), estimate.recommendation && ((0, jsx_runtime_1.jsxs)("div", { style: styles.recommendBanner, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("strong", { children: ["Recommended: ", estimate.recommendation.modelName] }), (0, jsx_runtime_1.jsxs)("span", { style: { marginLeft: '8px', color: '#666' }, children: ["(", estimate.recommendation.provider, ") \u2014 ", estimate.recommendation.reason] })] }), (0, jsx_runtime_1.jsx)("button", { style: styles.applyButton, onClick: () => handleApplyRecommendation(estimate.recommendation.modelId, estimate.recommendation.provider), children: "Apply This Model" })] })), (0, jsx_runtime_1.jsx)("h4", { style: styles.subheading, children: "All Compatible Models" }), (0, jsx_runtime_1.jsxs)("table", { style: styles.table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Model" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Provider" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Tier" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Context" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Est. Cost" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Status" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: estimate.costEstimates.map((c) => ((0, jsx_runtime_1.jsxs)("tr", { style: {
                                                ...styles.tr,
                                                opacity: c.canHandle ? 1 : 0.5,
                                                backgroundColor: c.recommended ? '#f0fdf4' : 'transparent',
                                            }, children: [(0, jsx_runtime_1.jsxs)("td", { style: styles.td, children: [(0, jsx_runtime_1.jsx)("strong", { children: c.modelName }), c.recommended && (0, jsx_runtime_1.jsx)("span", { style: styles.recommendBadge, children: "BEST VALUE" })] }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: c.provider }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("span", { style: { ...styles.tierBadge, backgroundColor: tierColors[c.tier] || '#999' }, children: c.tier }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: c.contextWindowFormatted }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("strong", { children: c.totalCostFormatted }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: c.canHandle ? ((0, jsx_runtime_1.jsx)("span", { style: { color: '#22c55e' }, children: c.reason || 'Compatible' })) : ((0, jsx_runtime_1.jsx)("span", { style: { color: '#ef4444' }, children: c.reason })) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: c.canHandle && ((0, jsx_runtime_1.jsx)("button", { style: styles.useButton, onClick: () => handleApplyRecommendation(c.modelId, c.provider), children: "Use" })) })] }, c.modelId))) })] }), estimate.largestDocuments.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h4", { style: styles.subheading, children: "Top 10 Largest Documents" }), (0, jsx_runtime_1.jsxs)("table", { style: styles.table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Document" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Collection" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Content Tokens" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Summary Call" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Entities Call" }), (0, jsx_runtime_1.jsx)("th", { style: styles.th, children: "Chunks Call" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: estimate.largestDocuments.map((doc, i) => ((0, jsx_runtime_1.jsxs)("tr", { style: styles.tr, children: [(0, jsx_runtime_1.jsx)("td", { style: styles.td, children: doc.title }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: doc.sourceCollection }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("strong", { children: doc.contentTokensFormatted }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("code", { style: styles.code, children: doc.callsBreakdown.summary }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("code", { style: styles.code, children: doc.callsBreakdown.entities }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.td, children: (0, jsx_runtime_1.jsx)("code", { style: styles.code, children: doc.callsBreakdown.chunks }) })] }, i))) })] })] }))] }))] })] }));
};
exports.AiSettings = AiSettings;
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