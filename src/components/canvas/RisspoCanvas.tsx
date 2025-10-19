import React from 'react'
import { Tldraw } from '@tldraw/tldraw'
import { useCanvasStore } from '../../stores/useCanvasStore'
import { NodeFactory } from './nodes/NodeFactory'

export const RisspoCanvas: React.FC = () => {
  const { nodes } = useCanvasStore()

  return (
    <div className="w-full h-full relative">
      <Tldraw
        persistenceKey="risspo-canvas"
        onMount={(editor) => {
          editor.updateInstanceState({ isDebugMode: false })
        }}
      />
      
      {/* Render custom nodes on top of tldraw */}
      <div className="absolute inset-0 pointer-events-none">
        {Object.values(nodes).map((node) => (
          <NodeFactory key={node.id} node={node} />
        ))}
      </div>
    </div>
  )
}
