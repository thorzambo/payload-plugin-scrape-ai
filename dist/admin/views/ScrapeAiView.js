import { jsx as _jsx } from "react/jsx-runtime";
import { DefaultTemplate } from '@payloadcms/next/templates';
import { DashboardClient } from './DashboardClient';
export function ScrapeAiView({ initPageResult, params, searchParams }) {
    return (_jsx(DefaultTemplate, { i18n: initPageResult.req.i18n, locale: initPageResult.locale, params: params, payload: initPageResult.req.payload, permissions: initPageResult.permissions, searchParams: searchParams, user: initPageResult.req.user || undefined, visibleEntities: initPageResult.visibleEntities, children: _jsx(DashboardClient, {}) }));
}
//# sourceMappingURL=ScrapeAiView.js.map