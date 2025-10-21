import { describe, it, expect } from 'vitest'
import { canvasReducer, type CanvasModel } from '../src/stores/canvasReducer'

const state = (over: Partial<CanvasModel> = {}): CanvasModel => ({
  nodes: [],
  viewport: { x: 0, y: 0, scale: 1 },
  selectedIds: [],
  ...over,
})

describe('canvasReducer', () => {
  it('select one and toggle selection', () => {
    let s = state({ nodes: [{ id: 'a', type: 'text', x: 0, y: 0, width: 10, height: 10, view: 'compact' }] as any })
    s = canvasReducer(s, { type: 'SELECT_ONE', id: 'a' })
    expect(s.selectedIds).toEqual(['a'])
    s = canvasReducer(s, { type: 'TOGGLE_SELECT', id: 'a' })
    expect(s.selectedIds).toEqual([])
  })

  it('create and bring to front updates order', () => {
    let s = state()
    s = canvasReducer(s, { type: 'CREATE_NODE', nodeType: 'text', at: { x: 100, y: 100 } })
    s = canvasReducer(s, { type: 'CREATE_NODE', nodeType: 'text', at: { x: 200, y: 200 } })
    const first = s.nodes[0].id
    const second = s.nodes[1].id
    s = canvasReducer(s, { type: 'BRING_TO_FRONT', id: first })
    expect(s.nodes[s.nodes.length - 1].id).toBe(first)
    // second should no longer be last
    expect(s.nodes[s.nodes.length - 1].id).not.toBe(second)
  })
})
