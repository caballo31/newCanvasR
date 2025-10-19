import React from 'react'
import { FolderNode as FolderNodeType } from '../../../types/canvas'
import { useCanvasStore } from '../../../stores/useCanvasStore'

interface FolderNodeProps {
  node: FolderNodeType
}

export const FolderNode: React.FC<FolderNodeProps> = ({ node }) => {
  const { nodes } = useCanvasStore()

  return (
    <div
      className="absolute pointer-events-auto bg-blue-50 border border-blue-200 rounded shadow-sm"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
    >
      <div className="p-3 border-b border-blue-200 bg-blue-100">
        <h3 className="font-medium text-blue-900">
          {node.name || 'Folder'} ({node.children.length})
        </h3>
      </div>
      <div className="p-2">
        <div className="text-sm text-blue-600">
          {node.view === 'compact' ? 'Compact View' : 'Window View'}
        </div>
      </div>
    </div>
  )
}
