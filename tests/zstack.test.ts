import { describe, it, expect } from 'vitest'
import { getVisualSize } from '../src/lib/zstack'
import type { BaseNode } from '../src/components/canvas/types/canvas'

const base = (over: Partial<BaseNode>): BaseNode => ({
  id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 100, view: 'compact', ...over,
})

describe('zstack utils', () => {
  it('getVisualSize returns compact size for non-window views', () => {
    const n = base({ view: 'compact', width: 500, height: 400 })
    const s = getVisualSize(n)
    expect(s.width).toBe(105)
    expect(s.height).toBe(105)
  })

  it('getVisualSize returns node size for window views', () => {
    const n = base({ view: 'window', width: 640, height: 420 })
    const s = getVisualSize(n)
    expect(s.width).toBe(640)
    expect(s.height).toBe(420)
  })
})
