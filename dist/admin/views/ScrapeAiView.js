import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { DashboardClient } from './DashboardClient';
export function ScrapeAiView({ initPageResult, params, searchParams }) {
    return /*#__PURE__*/ React.createElement(DefaultTemplate, {
        i18n: initPageResult.req.i18n,
        locale: initPageResult.locale,
        params: params,
        payload: initPageResult.req.payload,
        permissions: initPageResult.permissions,
        searchParams: searchParams,
        user: initPageResult.req.user || undefined,
        visibleEntities: initPageResult.visibleEntities
    }, /*#__PURE__*/ React.createElement(DashboardClient, null));
}

//# sourceMappingURL=ScrapeAiView.js.map