"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const NavLink = () => {
    return ((0, jsx_runtime_1.jsxs)("a", { href: "/admin/scrape-ai", style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            color: 'var(--theme-elevation-800, #444)',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.15s',
        }, onMouseEnter: (e) => {
            ;
            e.target.style.backgroundColor = 'var(--theme-elevation-50, #f5f5f5)';
        }, onMouseLeave: (e) => {
            ;
            e.target.style.backgroundColor = 'transparent';
        }, children: [(0, jsx_runtime_1.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 17l10 5 10-5" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 12l10 5 10-5" })] }), "Scrape AI"] }));
};
exports.default = NavLink;
//# sourceMappingURL=NavLink.js.map