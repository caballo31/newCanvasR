import { describe, it, expect } from 'vitest'
import { generateId } from '../src/lib/utils'

describe('generateId', () => {
  it('generates unique ids with shape: prefix', () => {
    const a = generateId()
    const b = generateId()
    expect(a).not.toBe(b)
    expect(a.startsWith('shape:')).toBe(true)
  })
})
