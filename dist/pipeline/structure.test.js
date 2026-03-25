import { describe, it, expect } from 'vitest';
import { structureContent, toUrlSlug, inferParent } from './structure';
describe('toUrlSlug', ()=>{
    it('replaces slashes with dashes', ()=>{
        expect(toUrlSlug('blog/2024/my-post')).toBe('blog-2024-my-post');
    });
    it('handles single segment', ()=>{
        expect(toUrlSlug('about')).toBe('about');
    });
    it('handles empty string', ()=>{
        expect(toUrlSlug('')).toBe('');
    });
});
describe('inferParent', ()=>{
    it('returns parent for nested slug', ()=>{
        expect(inferParent('blog/posts/my-post')).toBe('blog/posts');
    });
    it('returns parent for two-level slug', ()=>{
        expect(inferParent('blog/my-post')).toBe('blog');
    });
    it('returns undefined for top-level slug', ()=>{
        expect(inferParent('about')).toBeUndefined();
    });
});
describe('structureContent', ()=>{
    const baseParams = {
        markdown: 'Test content',
        doc: {
            title: 'Test Page',
            slug: 'test-page',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-06-01T00:00:00Z'
        },
        collectionSlug: 'pages',
        collectionConfig: {
            slug: 'pages',
            fields: []
        },
        siteUrl: 'https://example.com',
        siteName: 'Test Site'
    };
    it('generates valid YAML frontmatter', ()=>{
        const result = structureContent(baseParams);
        expect(result.markdown).toMatch(/^---\n/);
        expect(result.markdown).toContain('title: "Test Page"');
        expect(result.markdown).toContain('slug: "test-page"');
        expect(result.markdown).toContain('---');
    });
    it('escapes special characters in YAML', ()=>{
        const result = structureContent({
            ...baseParams,
            doc: {
                ...baseParams.doc,
                title: 'Test "with" quotes\nand newlines'
            }
        });
        expect(result.markdown).toContain('title: "Test \\"with\\" quotes\\nand newlines"');
    });
    it('sets correct canonicalUrl', ()=>{
        const result = structureContent(baseParams);
        expect(result.canonicalUrl).toBe('https://example.com/test-page');
    });
    it('detects draft status', ()=>{
        const result = structureContent({
            ...baseParams,
            doc: {
                ...baseParams.doc,
                _status: 'draft'
            }
        });
        expect(result.isDraft).toBe(true);
    });
    it('includes title as H1 heading', ()=>{
        const result = structureContent(baseParams);
        expect(result.markdown).toContain('# Test Page');
    });
    it('includes body markdown', ()=>{
        const result = structureContent(baseParams);
        expect(result.markdown).toContain('Test content');
    });
    it('returns correct slug (dashes instead of slashes)', ()=>{
        const result = structureContent({
            ...baseParams,
            doc: {
                ...baseParams.doc,
                slug: 'blog/my-post'
            }
        });
        expect(result.slug).toBe('blog-my-post');
        expect(result.urlSlug).toBe('blog-my-post');
    });
    it('detects parentSlug from nested slug', ()=>{
        const result = structureContent({
            ...baseParams,
            doc: {
                ...baseParams.doc,
                slug: 'blog/my-post'
            }
        });
        expect(result.parentSlug).toBe('blog');
    });
    it('sets parentSlug to undefined for top-level slug', ()=>{
        const result = structureContent(baseParams);
        expect(result.parentSlug).toBeUndefined();
    });
    it('includes locale when provided', ()=>{
        const result = structureContent({
            ...baseParams,
            locale: 'en'
        });
        expect(result.locale).toBe('en');
        expect(result.markdown).toContain('locale: "en"');
    });
    it('includes collection in frontmatter', ()=>{
        const result = structureContent(baseParams);
        expect(result.markdown).toContain('collection: "pages"');
    });
    it('includes contentType in frontmatter', ()=>{
        const result = structureContent(baseParams);
        // pages maps to WebPage
        expect(result.markdown).toContain('contentType: "WebPage"');
    });
    it('generates jsonLd', ()=>{
        const result = structureContent(baseParams);
        expect(result.jsonLd).toBeDefined();
        expect(result.jsonLd['@context']).toBe('https://schema.org');
        expect(result.jsonLd['@type']).toBe('WebPage');
    });
});

//# sourceMappingURL=structure.test.js.map