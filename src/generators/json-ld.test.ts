import { describe, it, expect } from 'vitest'
import { generateJsonLd } from './json-ld'

describe('generateJsonLd', () => {
  const baseParams = {
    title: 'Test Article',
    slug: 'test-article',
    collection: 'posts',
    siteUrl: 'https://example.com',
    siteName: 'Test Site',
  }

  it('generates valid JSON-LD structure', () => {
    const result = generateJsonLd(baseParams)
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Article')
    expect(result.name).toBe('Test Article')
    expect(result.url).toBe('https://example.com/test-article')
  })

  it('includes @id for entity resolution', () => {
    const result = generateJsonLd(baseParams)
    expect(result['@id']).toBe('https://example.com/test-article')
  })

  it('maps collection to correct schema type', () => {
    expect(generateJsonLd({ ...baseParams, collection: 'pages' })['@type']).toBe('WebPage')
    expect(generateJsonLd({ ...baseParams, collection: 'posts' })['@type']).toBe('Article')
    expect(generateJsonLd({ ...baseParams, collection: 'blog' })['@type']).toBe('BlogPosting')
    expect(generateJsonLd({ ...baseParams, collection: 'products' })['@type']).toBe('Product')
    expect(generateJsonLd({ ...baseParams, collection: 'faq' })['@type']).toBe('FAQPage')
    expect(generateJsonLd({ ...baseParams, collection: 'unknown' })['@type']).toBe('CreativeWork')
  })

  it('maps additional collection types correctly', () => {
    expect(generateJsonLd({ ...baseParams, collection: 'services' })['@type']).toBe('Service')
    expect(generateJsonLd({ ...baseParams, collection: 'events' })['@type']).toBe('Event')
    expect(generateJsonLd({ ...baseParams, collection: 'team' })['@type']).toBe('Person')
    expect(generateJsonLd({ ...baseParams, collection: 'reviews' })['@type']).toBe('Review')
    expect(generateJsonLd({ ...baseParams, collection: 'categories' })['@type']).toBe('Thing')
  })

  it('uses createdAt for datePublished on articles', () => {
    const result = generateJsonLd({
      ...baseParams,
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-06-01T00:00:00Z',
    })
    expect(result.datePublished).toBe('2024-01-01T00:00:00Z')
    expect(result.dateModified).toBe('2024-06-01T00:00:00Z')
  })

  it('falls back to lastModified for datePublished when no createdAt', () => {
    const result = generateJsonLd({
      ...baseParams,
      lastModified: '2024-06-01T00:00:00Z',
    })
    expect(result.datePublished).toBe('2024-06-01T00:00:00Z')
  })

  it('includes description when provided', () => {
    const result = generateJsonLd({ ...baseParams, description: 'A test article' })
    expect(result.description).toBe('A test article')
  })

  it('omits description when not provided', () => {
    const result = generateJsonLd(baseParams)
    expect(result.description).toBeUndefined()
  })

  it('includes isPartOf with site info', () => {
    const result = generateJsonLd(baseParams)
    expect(result.isPartOf).toEqual({
      '@type': 'WebSite',
      name: 'Test Site',
      url: 'https://example.com',
    })
  })

  it('includes headline for Article type', () => {
    const result = generateJsonLd({
      ...baseParams,
      createdAt: '2024-01-01T00:00:00Z',
    })
    expect(result.headline).toBe('Test Article')
  })

  it('includes headline for BlogPosting type', () => {
    const result = generateJsonLd({
      ...baseParams,
      collection: 'blog',
      createdAt: '2024-01-01T00:00:00Z',
    })
    expect(result.headline).toBe('Test Article')
  })

  it('does not include headline for WebPage type', () => {
    const result = generateJsonLd({
      ...baseParams,
      collection: 'pages',
    })
    expect(result.headline).toBeUndefined()
  })

  it('uses explicit contentType when provided', () => {
    const result = generateJsonLd({
      ...baseParams,
      contentType: 'HowTo',
    })
    expect(result['@type']).toBe('HowTo')
  })
})
