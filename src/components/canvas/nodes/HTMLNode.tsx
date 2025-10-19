import React from 'react'
import { NodeProps } from '../../../../types/canvas'
import { Code, X, Copy, Edit } from 'lucide-react'

const HTMLNode: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  viewport,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit
}) => {
  return (
    <div
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: (node.x + viewport.x) * viewport.scale,
        top: (node.y + viewport.y) * viewport.scale,
        width: node.width * viewport.scale,
        height: node.height * viewport.scale,
        backgroundColor: 'white',
        borderRadius: '8px',
        cursor: node.isDragging ? 'grabbing' : 'grab',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        userSelect: 'none',
        opacity: node.isDragging ? 0.8 : 1,
        transition: node.isDragging ? 'none' : 'all 0.15s ease',
        border: '1px solid #e5e7eb'
      }}
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
      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 rounded-lg">
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
