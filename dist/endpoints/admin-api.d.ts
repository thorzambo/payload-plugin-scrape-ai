import type { PayloadRequest } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Create all authenticated admin API endpoints for the dashboard.
 */
export declare function createAdminEndpoints(pluginOptions: ResolvedPluginConfig, pluginRawOptions: any): ({
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
} | {
    path: string;
    method: "post";
    handler: (req: PayloadRequest) => Promise<Response>;
})[];
//# sourceMappingURL=admin-api.d.ts.map