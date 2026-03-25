'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Banner } from '@payloadcms/ui';
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (_jsx(Banner, { type: "error", children: _jsxs("div", { children: [_jsx("strong", { children: this.props.fallbackLabel || 'Something went wrong' }), _jsx("p", { style: { fontSize: '0.8125rem', margin: '4px 0 0 0' }, children: this.state.error?.message || 'An unexpected error occurred' })] }) }));
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map