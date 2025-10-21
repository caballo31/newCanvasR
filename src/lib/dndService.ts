import type { BaseNode, Viewport } from '../components/canvas/types/canvas'
import { COMPACT_NODE_SIZE } from './constants'

export interface Point {
  x: number
  y: number
}

export function toWorld(p: Point, viewport: Viewport): Point {
  return {
    x: (p.x - viewport.x) / viewport.scale,
    y: (p.y - viewport.y) / viewport.scale,
  }
}

export function getNodeRect(node: BaseNode) {
  const isCompact = node.view !== 'window' && node.view !== 'fullscreen'
  const w = isCompact ? COMPACT_NODE_SIZE.width : node.width
  const h = isCompact ? COMPACT_NODE_SIZE.height : node.height
  return { x: node.x, y: node.y, w, h }
}

export function pointInRect(pt: Point, r: { x: number; y: number; w: number; h: number }) {
  return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h
}

// Priority: open folders (window) > compact folders > canvas root (null)
export function findDropTarget(nodes: BaseNode[], worldPoint: Point): { folderId: string | null } {
  const folders = nodes.filter((n) => n.type === 'folder')
  const openFolders = folders.filter((f) => f.view === 'window')
  const compactFolders = folders.filter((f) => !f.view || f.view === 'compact')

  for (let i = openFolders.length - 1; i >= 0; i--) {
    const f = openFolders[i]
    const r = getNodeRect(f)
    if (pointInRect(worldPoint, r)) return { folderId: f.id }
  }

  for (let i = compactFolders.length - 1; i >= 0; i--) {
    const f = compactFolders[i]
    const r = getNodeRect(f)
    if (pointInRect(worldPoint, r)) return { folderId: f.id }
  }

  return { folderId: null }
}
