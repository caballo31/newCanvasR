import React from 'react'
import { NodeProps } from '../types/canvas'
import { FileImage, X, Copy } from 'lucide-react'

const MediaNode: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  onSelect,
  onDelete,
  onDuplicate,
  onFileSelect
}) => {
  const handleMediaClick = () => {
    if (!node.fileUrl) {
      onFileSelect(node.id)
    }
  }

  return (
    <div
      data-node-id={node.id}
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
      onClick={() => onSelect(node.id)}
    >
      {/* Menu contextual para media con archivo */}
      {isSelected && node.fileUrl && (
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
        </div>
      )}

      {/* Contenido */}
      {node.fileUrl ? (
        <div className="w-full h-full" onClick={handleMediaClick} style={{ pointerEvents: 'none' }}>
          {node.file?.type.startsWith('image/') && (
            <img 
              src={node.fileUrl} 
              alt={node.content}
              className="w-full h-full object-contain"
            />
          )}
          {node.file?.type.startsWith('video/') && (
            <video 
              src={node.fileUrl}
              className="w-full h-full object-contain"
              controls
            />
          )}
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleMediaClick}
        >
          <FileImage size={32} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500 text-center">
            Click para cargar media
          </span>
        </div>
      )}
    </div>
  )
}

export default MediaNode
