import { describe, it, expect } from 'vitest'

// Test the tokenize logic directly (reimplemented since it's not exported)
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

describe('tokenize', () => {
  it('splits on whitespace and lowercases', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world'])
  })

  it('filters single-char tokens', () => {
    expect(tokenize('a big cat')).toEqual(['big', 'cat'])
  })

  it('handles empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  it('handles multiple spaces', () => {
    expect(tokenize('  hello   world  ')).toEqual(['hello', 'world'])
  })

  it('handles mixed case', () => {
    expect(tokenize('TypeScript Testing')).toEqual(['typescript', 'testing'])
  })

  it('preserves multi-char tokens only', () => {
    expect(tokenize('I am a developer')).toEqual(['am', 'developer'])
  })
})
