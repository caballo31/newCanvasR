import React from 'react'
import { TextNode as TextNodeType } from '../../../types/canvas'
import { useCanvasStore } from '../../../stores/useCanvasStore'

interface TextNodeProps {
  node: TextNodeType
}

export const TextNode: React.FC<TextNodeProps> = ({ node }) => {
  const { updateNode } = useCanvasStore()

  return (
    <div
      className="absolute pointer-events-auto bg-white border border-gray-300 rounded shadow-sm p-2"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
    >
      <div
        contentEditable
        className="w-full h-full outline-none"
        onBlur={(e) => {
          updateNode(node.id, { content: e.currentTarget.textContent || '' })
        }}
        dangerouslySetInnerHTML={{ __html: node.content }}
      />
    </div>
  )
}
