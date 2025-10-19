import React from 'react'
import { HTMLNode as HTMLNodeType } from '../../../types/canvas'

interface HTMLNodeProps {
  node: HTMLNodeType
}

export const HTMLNode: React.FC<HTMLNodeProps> = ({ node }) => {
  return (
    <div
      className="absolute pointer-events-auto bg-white border border-gray-300 rounded shadow-sm overflow-hidden"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
    >
      <div className="w-full h-full p-2 text-sm text-gray-500 flex items-center justify-center">
        [HTML Content - View Only]
      </div>
    </div>
  )
}
