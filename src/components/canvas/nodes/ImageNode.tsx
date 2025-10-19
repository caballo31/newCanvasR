import React from 'react'
import { ImageNode as ImageNodeType } from '../../../types/canvas'

interface ImageNodeProps {
  node: ImageNodeType
}

export const ImageNode: React.FC<ImageNodeProps> = ({ node }) => {
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
      <img
        src={node.src}
        alt={node.alt || 'Image node'}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
