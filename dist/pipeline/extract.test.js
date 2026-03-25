import { describe, it, expect } from 'vitest';
import { extractDocument } from './extract';
describe('extractDocument', () => {
    const mockPayload = {};
    it('extracts text fields', () => {
        const doc = { title: 'Hello World', description: 'A test' };
        const config = {
            slug: 'test',
            fields: [
                { name: 'title', type: 'text' },
                { name: 'description', type: 'text' },
            ],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('Hello World');
        expect(result).toContain('A test');
    });
    it('extracts number fields with label', () => {
        const doc = { price: 99.99 };
        const config = {
            slug: 'test',
            fields: [{ name: 'price', type: 'number' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**Price:** 99.99');
    });
    it('extracts checkbox fields', () => {
        const doc = { featured: true };
        const config = {
            slug: 'test',
            fields: [{ name: 'featured', type: 'checkbox' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**Featured:** Yes');
    });
    it('skips null/undefined/empty values', () => {
        const doc = { title: null, name: undefined, label: '' };
        const config = {
            slug: 'test',
            fields: [
                { name: 'title', type: 'text' },
                { name: 'name', type: 'text' },
                { name: 'label', type: 'text' },
            ],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toBe('');
    });
    it('skips system fields', () => {
        const doc = { id: '123', createdAt: '2024-01-01', title: 'Test' };
        const config = {
            slug: 'test',
            fields: [
                { name: 'id', type: 'text' },
                { name: 'createdAt', type: 'date' },
                { name: 'title', type: 'text' },
            ],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).not.toContain('123');
        expect(result).toContain('Test');
    });
    it('extracts Lexical richText', () => {
        const doc = {
            content: {
                root: {
                    children: [
                        {
                            type: 'paragraph',
                            children: [{ text: 'Hello world', format: 0 }],
                        },
                        {
                            type: 'heading',
                            tag: 'h2',
                            children: [{ text: 'A Heading', format: 0 }],
                        },
                    ],
                },
            },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('Hello world');
        expect(result).toContain('## A Heading');
    });
    it('handles Lexical bold/italic/code formatting', () => {
        const doc = {
            content: {
                root: {
                    children: [
                        {
                            type: 'paragraph',
                            children: [
                                { text: 'bold', format: 1 },
                                { text: 'italic', format: 2 },
                                { text: 'code', format: 16 },
                                { text: 'bold-italic', format: 3 },
                            ],
                        },
                    ],
                },
            },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**bold**');
        expect(result).toContain('*italic*');
        expect(result).toContain('`code`');
        expect(result).toContain('***bold-italic***');
    });
    it('extracts Lexical lists', () => {
        const doc = {
            content: {
                root: {
                    children: [
                        {
                            type: 'list',
                            listType: 'bullet',
                            children: [
                                { type: 'listitem', children: [{ text: 'Item 1', format: 0 }] },
                                { type: 'listitem', children: [{ text: 'Item 2', format: 0 }] },
                            ],
                        },
                    ],
                },
            },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('- Item 1');
        expect(result).toContain('- Item 2');
    });
    it('extracts Slate richText', () => {
        const doc = {
            content: [
                { type: 'h1', children: [{ text: 'Title' }] },
                { type: 'h2', children: [{ text: 'Subtitle' }] },
                { children: [{ text: 'Normal paragraph' }] },
            ],
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('# Title');
        expect(result).toContain('## Subtitle');
        expect(result).toContain('Normal paragraph');
    });
    it('extracts Slate code blocks', () => {
        const doc = {
            content: [{ type: 'code', children: [{ text: 'const x = 1' }] }],
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('```');
        expect(result).toContain('const x = 1');
    });
    it('extracts blocks with numeric values', () => {
        const doc = {
            layout: [
                {
                    blockType: 'hero',
                    heading: 'Welcome',
                    height: 500,
                    fullWidth: true,
                },
            ],
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'layout', type: 'blocks' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('Welcome');
        expect(result).toContain('**Height:** 500');
        expect(result).toContain('**Full Width:** true');
    });
    it('extracts relationship fields', () => {
        const doc = {
            category: { title: 'Technology', id: '123' },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'category', type: 'relationship' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**Category:** Technology');
    });
    it('extracts select values', () => {
        const doc = { status: 'published' };
        const config = {
            slug: 'test',
            fields: [{ name: 'status', type: 'select' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**Status:** published');
    });
    it('extracts date fields with label', () => {
        const doc = { publishDate: '2024-06-15' };
        const config = {
            slug: 'test',
            fields: [{ name: 'publishDate', type: 'date' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('**Publish Date:** 2024-06-15');
    });
    it('extracts email fields as plain text', () => {
        const doc = { contactEmail: 'test@example.com' };
        const config = {
            slug: 'test',
            fields: [{ name: 'contactEmail', type: 'email' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('test@example.com');
    });
    it('extracts textarea fields', () => {
        const doc = { bio: 'A long description\nwith multiple lines' };
        const config = {
            slug: 'test',
            fields: [{ name: 'bio', type: 'textarea' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('A long description\nwith multiple lines');
    });
    it('extracts group fields recursively', () => {
        const doc = {
            seo: { metaTitle: 'SEO Title', metaDescription: 'SEO Desc' },
        };
        const config = {
            slug: 'test',
            fields: [
                {
                    name: 'seo',
                    type: 'group',
                    fields: [
                        { name: 'metaTitle', type: 'text' },
                        { name: 'metaDescription', type: 'text' },
                    ],
                },
            ],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('SEO Title');
        expect(result).toContain('SEO Desc');
    });
    it('handles hasMany relationships (array)', () => {
        const doc = {
            tags: [
                { title: 'TypeScript', id: '1' },
                { title: 'Testing', id: '2' },
            ],
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'tags', type: 'relationship' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('TypeScript');
        expect(result).toContain('Testing');
    });
    it('extracts json/code fields as JSON code blocks', () => {
        const doc = { config: { key: 'value' } };
        const config = {
            slug: 'test',
            fields: [{ name: 'config', type: 'json' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('```json');
        expect(result).toContain('"key": "value"');
    });
    it('handles Lexical bold+italic combined format (format=3)', () => {
        const doc = {
            content: {
                root: {
                    children: [
                        {
                            type: 'paragraph',
                            children: [{ text: 'emphasized', format: 3 }],
                        },
                    ],
                },
            },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        // format=3 means bold(1) + italic(2): bold applied first wrapping with **, then italic with *
        expect(result).toContain('***emphasized***');
    });
    it('handles Lexical strikethrough (format=4)', () => {
        const doc = {
            content: {
                root: {
                    children: [
                        {
                            type: 'paragraph',
                            children: [{ text: 'deleted', format: 4 }],
                        },
                    ],
                },
            },
        };
        const config = {
            slug: 'test',
            fields: [{ name: 'content', type: 'richText' }],
        };
        const result = extractDocument(doc, config, mockPayload);
        expect(result).toContain('~~deleted~~');
    });
});
//# sourceMappingURL=extract.test.js.map