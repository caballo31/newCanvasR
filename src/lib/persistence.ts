import type { BaseNode, Viewport } from '../components/canvas/types/canvas'
import { APP_NAME, SCHEMA_VERSION } from './constants'

export interface PersistedStateV1 {
  schemaVersion: number
  app: string
  nodes: BaseNode[]
  viewport: Viewport
}

export function serializeState(nodes: BaseNode[], viewport: Viewport): string {
  const payload: PersistedStateV1 = {
    schemaVersion: SCHEMA_VERSION,
    app: APP_NAME,
    nodes: sanitizeNodes(nodes),
    viewport: { ...viewport },
  }
  return JSON.stringify(payload, null, 2)
}

export function deserializeState(json: string): { nodes: BaseNode[]; viewport: Viewport } | null {
  try {
    const data = JSON.parse(json)
    if (!data || typeof data !== 'object') return null

    // support old shape {nodes, viewport} without schema
    if (!('schemaVersion' in data)) {
      if (Array.isArray(data.nodes) && isViewport(data.viewport)) {
        return { nodes: sanitizeNodes(data.nodes), viewport: data.viewport }
      }
      return null
    }

    if (data.schemaVersion !== SCHEMA_VERSION) {
      // here we could run migrations; for now, reject mismatched versions
      // or accept if structure looks compatible
    }

    if (Array.isArray(data.nodes) && isViewport(data.viewport)) {
      return { nodes: sanitizeNodes(data.nodes), viewport: data.viewport }
    }

    return null
  } catch {
    return null
  }
}

function isViewport(v: any): v is Viewport {
  return v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.scale === 'number'
}

function sanitizeNodes(nodes: BaseNode[]): BaseNode[] {
  // Remove non-serializable bits like File objects
  return nodes.map((n) => {
    const { file, ...rest } = n as any
    return { ...rest, file: null }
  })
}
