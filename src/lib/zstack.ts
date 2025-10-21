import type { BaseNode } from '../components/canvas/types/canvas'
import { COMPACT_NODE_SIZE, Z_BANDS } from './constants'

export type Band = 'COMPACT' | 'WINDOWS' | 'FOLDER_WINDOWS'

export interface ZStackEntry {
  id: string
  band: Band
  z: number
}

// Determine visual band for a node based on its type and view
export function getNodeBand(node: BaseNode): Band {
  const isWindowLike = node.view === 'window' || node.view === 'fullscreen'
  if (!isWindowLike) return 'COMPACT'
  return node.type === 'folder' ? 'FOLDER_WINDOWS' : 'WINDOWS'
}

// Compute draw order by bands maintaining relative order inside each band
export function orderByZStack(nodes: BaseNode[]): BaseNode[] {
  const buckets: Record<Band, BaseNode[]> = {
    COMPACT: [],
    WINDOWS: [],
    FOLDER_WINDOWS: [],
  }

  for (const n of nodes) {
    if (n.view === 'fullscreen') continue // fullscreen is rendered elsewhere
    buckets[getNodeBand(n)].push(n)
  }

  // within each bucket, keep input order (assuming last is top-most inside band)
  const out: BaseNode[] = []
  out.push(...buckets.COMPACT)
  out.push(...buckets.WINDOWS)
  out.push(...buckets.FOLDER_WINDOWS)
  return out
}

// Provide z-index style for a node wrapper based on its band; consumers may add small offsets
export function getZIndexFor(node: BaseNode): number {
  const band = getNodeBand(node)
  switch (band) {
    case 'COMPACT':
      return Z_BANDS.COMPACT
    case 'WINDOWS':
      return Z_BANDS.WINDOWS
    case 'FOLDER_WINDOWS':
      return Z_BANDS.FOLDER_WINDOWS
  }
}

// Utility used by selection/marquee math to get visible bounds size for a node
export function getVisualSize(node: BaseNode): { width: number; height: number } {
  const isCompact = node.view !== 'window' && node.view !== 'fullscreen'
  if (isCompact) return { ...COMPACT_NODE_SIZE }
  return { width: node.width, height: node.height }
}
