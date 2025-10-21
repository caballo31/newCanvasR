import React, { useMemo, useState } from 'react'
import { Folder as FolderIcon } from 'lucide-react'
import { NodeProps, BaseNode } from '../types/canvas'
import { CompactThumb } from './NodeIcons'

type FolderNodeProps = NodeProps & {
  allNodes?: BaseNode[]
  onAddToFolder?: (childId: string, folderId: string) => void
}

const FolderNode: React.FC<FolderNodeProps> = ({
  node,
  onSelect,
  onUpdate,
  allNodes,
  onAddToFolder,
}) => {
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

  // Compact view: icon + name
  if (!isWindowLike) {
    return (
      <div
        data-node-id={node.id}
        style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
        onClick={() => onSelect(node.id)}
      >
        {/* Per-node contextual menu removed — global floating toolbar is used instead */}

        <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50 rounded-lg">
          <div className="text-center">
            <FolderIcon size={28} className="text-gray-500 mb-2 mx-auto" />
            <div className="text-sm text-gray-700">{node.content}</div>
          </div>
        </div>
      </div>
    )
  }

  // Window view: show a simple window with children listed and allow dropping
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
      onClick={() => onSelect(node.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const droppedId = e.dataTransfer.getData('text/node-id')
        if (droppedId && onAddToFolder) {
          onAddToFolder(droppedId, node.id)
        }
      }}
    >
      {/* Per-node contextual menu removed — global floating toolbar is used instead */}

      <div className="w-full h-full" style={{ padding: 8 }}>
        <div
          className="w-full h-full overflow-auto grid grid-cols-3 gap-2"
          style={{ alignItems: 'start', gridAutoRows: 'min-content' }}
          onClick={() => {
            // clicking on the folder background clears any child selection
            setSelectedChild(null)
          }}
        >
          {children.map((child) => (
            <div
              key={child.id}
              className={`relative bg-gray-50 rounded text-center text-sm shadow-sm ${
                selectedChild === child.id ? 'ring-2 ring-orange-300' : ''
              }`}
              style={{ padding: 0, display: 'flex', justifyContent: 'center' }}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/node-id', child.id)
                try {
                  e.dataTransfer.effectAllowed = 'move'
                } catch {}
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedChild(child.id)
                onSelect && onSelect(child.id)
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
    </div>
  )
}

export default FolderNode
