import React from 'react'
import { NodeProps } from '../types/canvas'
import { X, Copy, Edit } from 'lucide-react'

const TextNode: React.FC<NodeProps> = ({ 
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
              const newContent = prompt('Editar texto:', node.content)
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
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="text-lg text-gray-800 font-light">
          {node.content}
        </div>
      </div>
    </div>
  )
}

export default TextNode
