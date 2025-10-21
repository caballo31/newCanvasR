import type { BaseNode, Viewport } from '../components/canvas/types/canvas'
import { GRID_SIZE, COMPACT_NODE_SIZE } from '../lib/constants'

// Pure helpers operating on state structures only

export function updateNodeById(nodes: BaseNode[], id: string, updates: Partial<BaseNode>): BaseNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, ...updates } : n))
}

export function bringToFront(nodes: BaseNode[], id: string): BaseNode[] {
  const idx = nodes.findIndex((n) => n.id === id)
  if (idx === -1) return nodes
  const copy = nodes.slice()
  const [item] = copy.splice(idx, 1)
  copy.push(item)
  return copy
}

export function removeNodeById(nodes: BaseNode[], id: string): BaseNode[] {
  return nodes.filter((n) => n.id !== id)
}

export function duplicateNode(nodes: BaseNode[], id: string, makeId: () => string): BaseNode[] {
  const src = nodes.find((n) => n.id === id)
  if (!src) return nodes
  const copy: BaseNode = {
    ...src,
    id: makeId(),
    x: src.x + 20,
    y: src.y + 20,
    isSelected: false,
    isDragging: false,
  }
  return [...nodes, copy]
}

export function addChildToFolder(nodes: BaseNode[], childId: string, folderId: string): BaseNode[] {
  const folder = nodes.find((n) => n.id === folderId && n.type === 'folder')
  if (!folder) return nodes
  const children = Array.from(new Set([...(folder.children || []), childId]))
  const updated = updateNodeById(nodes, childId, { parent: folderId })
  return updateNodeById(updated, folderId, { children })
}

export function snapSelectionToGrid(
  nodes: BaseNode[],
  selectedIds: string[],
  grid: number = GRID_SIZE
): BaseNode[] {
  return nodes.map((n) => {
    if (!selectedIds.includes(n.id)) return n
    const snappedX = Math.round(n.x / grid) * grid
    const snappedY = Math.round(n.y / grid) * grid
    const snappedW = Math.max(50, Math.round(n.width / grid) * grid)
    const snappedH = Math.max(50, Math.round(n.height / grid) * grid)
    return { ...n, x: snappedX, y: snappedY, width: snappedW, height: snappedH }
  })
}

// Center viewport on content bounds (top-level nodes only)
export function centerViewportOnContent(
  viewport: Viewport,
  nodes: BaseNode[],
  winW: number,
  winH: number
): Viewport {
  const tops = nodes.filter((n) => !n.parent && n.view !== 'fullscreen')
  if (tops.length === 0) return { ...viewport, x: 0, y: 0 }
  const minX = Math.min(...tops.map((n) => n.x))
  const minY = Math.min(...tops.map((n) => n.y))
  const maxX = Math.max(
    ...tops.map((n) => n.x + (n.view === 'window' ? n.width : COMPACT_NODE_SIZE.width))
  )
  const maxY = Math.max(
    ...tops.map((n) => n.y + (n.view === 'window' ? n.height : COMPACT_NODE_SIZE.height))
  )
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return {
    ...viewport,
    x: winW / 2 - cx * viewport.scale,
    y: winH / 2 - cy * viewport.scale,
  }
}
