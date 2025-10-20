import React, { useMemo } from 'react'
import { Folder as FolderIcon } from 'lucide-react'
import { NodeProps, BaseNode } from '../types/canvas'

type FolderNodeProps = NodeProps & {
  allNodes?: BaseNode[]
  onAddToFolder?: (childId: string, folderId: string) => void
}

const FolderNode: React.FC<FolderNodeProps> = ({ node, onSelect, allNodes, onAddToFolder }) => {
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

  const isWindow = node.view === 'window'

  // Compact view: icon + name
  if (!isWindow) {
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

      <div className="w-full h-full bg-white border rounded-lg shadow-sm p-2 flex flex-col">
        <div className="flex items-center justify-between px-2 py-1 border-b">
          <div className="flex items-center gap-2">
            <FolderIcon size={18} />
            <div className="font-medium">{node.content}</div>
          </div>
          <div className="text-sm text-gray-500">{children.length} items</div>
        </div>

        <div className="flex-1 overflow-auto p-2 grid grid-cols-3 gap-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-gray-50 rounded p-2 text-center text-sm shadow-sm"
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/node-id', child.id)
                try {
                  e.dataTransfer.effectAllowed = 'move'
                } catch {}
              }}
            >
              {child.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FolderNode
