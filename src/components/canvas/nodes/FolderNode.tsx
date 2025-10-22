import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Folder as FolderIcon } from 'lucide-react'
import { NodeProps, BaseNode } from '../types/canvas'
import { CompactThumb } from './NodeIcons'

type FolderNodeProps = NodeProps & {
  allNodes?: BaseNode[]
  onAddToFolder?: (childId: string, folderId: string) => void
  onClearSelection?: () => void
}

const FolderNode: React.FC<FolderNodeProps> = ({ node, onUpdate, allNodes, onAddToFolder, onSelect, onClearSelection }) => {
  const nodesMap = useMemo(() => {
    const map: Record<string, BaseNode> = {}
    ;(allNodes || []).forEach((n) => {
      map[n.id] = n
    })
    return map
  }, [allNodes])

  const children = useMemo(() => {
    if (!node.children || node.children.length === 0) return []
    return node.children.map((id) => nodesMap[id]).filter(Boolean)
  }, [node.children, nodesMap])

  const isWindowLike = node.view === 'window' || node.view === 'fullscreen'
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const holderRef = useRef<HTMLDivElement | null>(null)

  // Detect clicks outside the folder content to clear local child selection.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const root = holderRef.current
      if (!root) return

      // Use composedPath when available (covers Shadow DOM / portals)
      const path = (e.composedPath && typeof e.composedPath === 'function') ? e.composedPath() : [e.target]
      // If any element in the path is the root, it's an inside click
      for (const el of path as EventTarget[]) {
        try {
          if (el === root || (el instanceof Node && root.contains(el as Node))) {
            return
          }
        } catch {
          // ignore
        }
      }

      // Fallback: if target is not inside root, clear selection
      const target = e.target as Node | null
      if (target && root && !root.contains(target)) {
        setSelectedChild(null)
      }
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  // Compact view: icon + name
  if (!isWindowLike) {
    return (
      <div
        data-node-id={node.id}
        style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
      >
        <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50 rounded-lg">
          <div className="text-center">
            <FolderIcon size={28} className="text-gray-500 mb-2 mx-auto" />
            <div className="text-sm text-gray-700">{node.content}</div>
          </div>
        </div>
      </div>
    )
  }

  // Window view: show children grid (content area starts at top: 56px like other windows)
  return (
    <div
      data-node-id={node.id}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const droppedId = e.dataTransfer.getData('text/node-id')
        if (droppedId && onAddToFolder) {
          onAddToFolder(droppedId, node.id)
        }
      }}
    >
      {/* Content area (offset by 56px top for header, 12px padding) */}
      <div
        ref={holderRef}
        className="w-full h-full overflow-auto grid grid-cols-3 gap-2"
        style={{
          padding: 12,
          boxSizing: 'border-box',
          alignItems: 'start',
          gridAutoRows: 'min-content',
        }}
        // Prevent clicks on the folder content area from bubbling to the canvas
        // so only the header (data-drag-handle) remains interactive for selection,
        // dragging, resizing and the floating action button. Child items still
        // handle their own clicks (they stop propagation themselves).
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onClick={() => {
          // clicking on the folder background clears any local child selection
          setSelectedChild(null)
          // and optionally clear global selection (notify canvas)
          if (onClearSelection) onClearSelection()
        }}
      >
        {children.map((child) => (
          <div
            key={child.id}
            data-child-id={child.id}
            className={`relative bg-gray-50 rounded text-center text-sm shadow-sm ${
              selectedChild === child.id ? 'ring-2 ring-orange-300' : ''
            }`}
            style={{
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/node-id', child.id)
              try {
                e.dataTransfer.effectAllowed = 'move'
              } catch {}
            }}
            onClick={(e) => {
              // Stop propagation to keep event handling local, then also
              // notify canvas selection so folder deselects and child becomes selected.
              e.stopPropagation()
              setSelectedChild(child.id)
              try {
                // call the canvas-level onSelect passed via props
                onSelect && onSelect(child.id)
              } catch {}
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              // open child in fullscreen directly
              onUpdate && onUpdate(child.id, { view: 'fullscreen' })
            }}
          >
            <div style={{ pointerEvents: 'none', padding: 8 }}>
              <CompactThumb type={child.type} title={child.title} label={child.content} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FolderNode
