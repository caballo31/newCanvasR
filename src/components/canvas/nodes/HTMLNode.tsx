import React from 'react'
import { NodeProps } from '../types/canvas'
import { Code } from 'lucide-react'

const HTMLNode: React.FC<NodeProps> = ({ 
  node, 
  onSelect,
}) => {
  return (
    <div
      data-node-id={node.id}
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
      onClick={() => onSelect(node.id)}
    >
      {/* Per-node contextual menu removed — global floating toolbar is used instead */}

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
