/**
 * Generate HTML <link> and <meta> tags for AI content discoverability.
 * Site owners should add these to their <head> section.
 *
 * These tags allow AI agents to discover the content index
 * from any page on the site, following the same pattern as
 * robots.txt, sitemap.xml, and RSS feed discovery.
 */
export declare function generateHeadTags(siteUrl: string): string;
/**
 * Returns structured data for the head tags, useful for
 * programmatic insertion in React/Next.js apps.
 */
export declare function getDiscoveryLinks(siteUrl: string): Array<{
    rel: string;
    href: string;
    type: string;
    title: string;
}>;
//# sourceMappingURL=head-tags.d.ts.map