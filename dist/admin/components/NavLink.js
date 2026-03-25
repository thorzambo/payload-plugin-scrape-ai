'use client';
import React from 'react';
import { Link } from '@payloadcms/ui';
const NavLink = ()=>{
    return /*#__PURE__*/ React.createElement(Link, {
        href: "/admin/scrape-ai",
        className: "scrape-ai-nav",
        preventDefault: false
    }, /*#__PURE__*/ React.createElement("span", {
        className: "scrape-ai-nav__icon"
    }, /*#__PURE__*/ React.createElement("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }, /*#__PURE__*/ React.createElement("path", {
        d: "M12 2L2 7l10 5 10-5-10-5z"
    }), /*#__PURE__*/ React.createElement("path", {
        d: "M2 17l10 5 10-5"
    }), /*#__PURE__*/ React.createElement("path", {
        d: "M2 12l10 5 10-5"
    }))), "Scrape AI");
};
export default NavLink;

//# sourceMappingURL=NavLink.js.map