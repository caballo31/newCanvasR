import { describe, it, expect } from 'vitest'
import { serializeState, deserializeState } from '../src/lib/persistence'
import type { BaseNode, Viewport } from '../src/components/canvas/types/canvas'

const sampleNodes: BaseNode[] = [
  { id: 'a', type: 'text', x: 10, y: 20, width: 100, height: 80, content: 'Hello', view: 'compact' },
  { id: 'b', type: 'folder', x: 30, y: 40, width: 300, height: 200, content: 'Folder', children: [], view: 'window' },
]
const viewport: Viewport = { x: 0, y: 0, scale: 1 }

describe('persistence', () => {
  it('round-trips state with schemaVersion', () => {
    const json = serializeState(sampleNodes, viewport)
    const parsed = deserializeState(json)
    expect(parsed).not.toBeNull()
    expect(parsed!.nodes.length).toBe(2)
    expect(parsed!.viewport).toEqual(viewport)
  })

  it('sanitizes non-serializable fields', () => {
    const withFile: BaseNode[] = [
      { ...sampleNodes[0], id: 'c', file: {} as any, fileUrl: 'blob://x' },
    ]
    const json = serializeState(withFile, viewport)
    const parsed = deserializeState(json)
    expect(parsed).not.toBeNull()
    // file should be null after sanitize
    expect((parsed!.nodes[0] as any).file).toBeNull()
  })
})
