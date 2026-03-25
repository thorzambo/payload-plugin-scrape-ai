'use client';
import React from 'react';
import { Banner } from '@payloadcms/ui';
export class ErrorBoundary extends React.Component {
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    render() {
        if (this.state.hasError) {
            return /*#__PURE__*/ React.createElement(Banner, {
                type: "error"
            }, /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("strong", null, this.props.fallbackLabel || 'Something went wrong'), /*#__PURE__*/ React.createElement("p", {
                className: "scrape-ai-error-detail"
            }, this.state.error?.message || 'An unexpected error occurred')));
        }
        return this.props.children;
    }
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
}

//# sourceMappingURL=ErrorBoundary.js.map