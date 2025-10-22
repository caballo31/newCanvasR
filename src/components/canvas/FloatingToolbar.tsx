import React from 'react'
import type { BaseNode, Viewport } from './types/canvas'
import { Copy, Edit, Trash } from 'lucide-react'
import { getVisualSize } from '../../lib/zstack'
import { COMPACT_NODE_SIZE } from '../../lib/constants'

interface FloatingToolbarProps {
  nodes: BaseNode[]
  viewport: Viewport
  selectedIds: string[]
  selectedNode: string | null
  onDelete: (ids: string[]) => void
  onDuplicate: (ids: string[]) => void
  onEdit: (anchorId: string) => void
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  nodes,
  viewport,
  selectedIds,
  selectedNode,
  onDelete,
  onDuplicate,
  onEdit,
}) => {
  const hasAny = !!selectedNode || selectedIds.length > 0
  if (!hasAny) return null

  const selected = selectedIds.length > 0 ? nodes.filter((n) => selectedIds.includes(n.id)) : []
  // filter visible nodes: nodes that are not children of a closed (compact) folder
  const selectedVisible = selected.filter((n) => {
    if (!n) return false
    if (!n.parent) return true
    const parent = nodes.find((p) => p.id === n.parent)
    return !!parent && (parent.view === 'window' || parent.view === 'fullscreen')
  })
  let left = 0
  let top = 0
  let anchorNode: BaseNode | undefined

  if (selected.length > 1) {
    // If none of the selected items are visible (e.g. they live inside a compact folder), don't show toolbar
    if (selectedVisible.length === 0) return null
    const minX = Math.min(...selectedVisible.map((n) => n.x))
    const minY = Math.min(...selectedVisible.map((n) => n.y))
    const maxX = Math.max(...selectedVisible.map((n) => n.x + getVisualSize(n).width))
    const maxY = Math.max(...selectedVisible.map((n) => n.y + getVisualSize(n).height))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    left = cx * viewport.scale + viewport.x
    top = cy * viewport.scale + viewport.y - 20
  } else {
    const anchorId = selectedNode || (selectedIds.length ? selectedIds[selectedIds.length - 1] : null)
    anchorNode = nodes.find((n) => n.id === anchorId)
    if (!anchorNode) return null

    // If the anchor is a child of a folder, use the folder (parent) as the visual anchor
    const anchorParentId = anchorNode.parent
    if (anchorParentId) {
      const parent = nodes.find((p) => p.id === anchorParentId)
      if (!parent) return null
      // If the parent folder is compact/closed, do not show toolbar
      if (parent.view !== 'window' && parent.view !== 'fullscreen') return null
      anchorNode = parent
    }

    // Do not show toolbar for fullscreen nodes
    if (anchorNode.view === 'fullscreen') return null

    // compute screen-space position from world coords: screen = world * scale + viewportOffset
    const screenX = anchorNode.x * viewport.scale + viewport.x
    const screenY = anchorNode.y * viewport.scale + viewport.y
    const nodeWidth = anchorNode.view === 'window' ? anchorNode.width : COMPACT_NODE_SIZE.width
    left = screenX + (nodeWidth * viewport.scale) / 2
    const offsetY = anchorNode.view === 'window' ? 28 : 10
    top = screenY - offsetY
  }
  const ids = selectedIds.length > 0 ? selectedIds : anchorNode ? [anchorNode.id] : []

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <div className="bg-gray-800 text-white rounded-md shadow-lg p-2 flex gap-3 items-center" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (ids.length > 0) onDelete(ids)
          }}
          title="Eliminar"
          className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
          aria-label="Eliminar"
        >
          <Trash size={14} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (ids.length > 0) onDuplicate(ids)
          }}
          title="Duplicar"
          className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center"
          aria-label="Duplicar"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            const anchorId = selectedNode || (selectedIds.length ? selectedIds[selectedIds.length - 1] : null)
            if (anchorId) onEdit(anchorId)
          }}
          title="Editar"
          className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center"
          aria-label="Editar"
        >
          <Edit size={14} />
        </button>
      </div>
    </div>
  )
}

export default FloatingToolbar
