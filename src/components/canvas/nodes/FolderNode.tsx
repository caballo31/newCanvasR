import React, { useMemo } from 'react'
import { Folder as FolderIcon, X, Copy, Edit } from 'lucide-react'
import { NodeProps } from '../types/canvas'
import { useCanvasStore } from '../../../stores/useCanvasStore'

const FolderNode: React.FC<NodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onEdit
}) => {
  const nodes = useCanvasStore(state => state.nodes)
  const addToFolder = useCanvasStore(state => state.addToFolder)

  const children = useMemo(() => {
    if (!node.children || node.children.length === 0) return []
    return node.children.map(id => nodes[id]).filter(Boolean)
  }, [node.children, nodes])

  const isWindow = node.view === 'window'

  // Compact view: icon + name
  if (!isWindow) {
    return (
      <div
        data-node-id={node.id}
        style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
        onClick={() => onSelect(node.id)}
      >
        {isSelected && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1 bg-gray-800 rounded-md p-1 shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.id) }}
              className="p-1 hover:bg-gray-700 rounded text-white"
              title="Eliminar"
            ><X size={12} /></button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(node.id) }}
              className="p-1 hover:bg-gray-700 rounded text-white"
              title="Duplicar"
            ><Copy size={12} /></button>
            <button
              onClick={(e) => { e.stopPropagation(); const newName = prompt('Editar nombre de carpeta:', node.content); if (newName !== null) onEdit(node.id, newName) }}
              className="p-1 hover:bg-gray-700 rounded text-white"
              title="Editar"
            ><Edit size={12} /></button>
          </div>
        )}

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
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none', overflow: 'hidden' }}
      onClick={() => onSelect(node.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const droppedId = e.dataTransfer.getData('text/node-id')
        if (droppedId) {
          addToFolder(droppedId, node.id)
        }
      }}
    >
      {isSelected && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1 bg-gray-800 rounded-md p-1 shadow-lg">
          <button onClick={(e) => { e.stopPropagation(); onDelete(node.id) }} className="p-1 hover:bg-gray-700 rounded text-white" title="Eliminar"><X size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(node.id) }} className="p-1 hover:bg-gray-700 rounded text-white" title="Duplicar"><Copy size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); const newName = prompt('Editar nombre de carpeta:', node.content); if (newName !== null) onEdit(node.id, newName) }} className="p-1 hover:bg-gray-700 rounded text-white" title="Editar"><Edit size={12} /></button>
        </div>
      )}

      <div className="w-full h-full bg-white border rounded-lg shadow-sm p-2 flex flex-col">
        <div className="flex items-center justify-between px-2 py-1 border-b">
          <div className="flex items-center gap-2">
            <FolderIcon size={18} />
            <div className="font-medium">{node.content}</div>
          </div>
          <div className="text-sm text-gray-500">{children.length} items</div>
        </div>

        <div className="flex-1 overflow-auto p-2 grid grid-cols-3 gap-2">
          {children.map(child => (
            <div key={child.id} className="bg-gray-50 rounded p-2 text-center text-sm shadow-sm">
              {child.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FolderNode
