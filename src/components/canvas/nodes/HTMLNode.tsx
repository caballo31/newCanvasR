import React from 'react'
import { NodeProps } from '../types/canvas'
import { Code, X, Copy, Edit } from 'lucide-react'

const HTMLNode: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  onSelect,
  onDelete,
  onDuplicate,
  onEdit
}) => {
  return (
    <div
      data-node-id={node.id}
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
      onClick={() => onSelect(node.id)}
    >
      {/* Menu contextual */}
      {isSelected && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1 bg-gray-800 rounded-md p-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
            className="p-1 hover:bg-gray-700 rounded text-white"
            title="Eliminar"
          >
            <X size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(node.id)
            }}
            className="p-1 hover:bg-gray-700 rounded text-white"
            title="Duplicar"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newContent = prompt('Editar contenido HTML:', node.content)
              if (newContent !== null) {
                onEdit(node.id, newContent)
              }
            }}
            className="p-1 hover:bg-gray-700 rounded text-white"
            title="Editar"
          >
            <Edit size={12} />
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 rounded-lg" style={{ pointerEvents: 'none' }}>
        <div className="text-center">
          <Code size={24} className="text-gray-400 mb-2 mx-auto" />
          <div className="text-sm text-gray-600">
            {node.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HTMLNode
