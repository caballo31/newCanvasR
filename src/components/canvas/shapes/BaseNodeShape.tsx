import { useEditor, TLComponents, Tldraw, Vec, TLShape, TLShapeId } from '@tldraw/tldraw'
import React from 'react'

// Definir el tipo de shape para nuestros nodos
export type RisspoNodeShape = TLShape & {
  type: 'risspo-node'
  props: {
    nodeId: string
    nodeType: 'text' | 'image' | 'html' | 'folder'
    content?: string
    src?: string
    children?: string[]
    view?: 'compact' | 'window'
  }
}

// Componente de renderizado para el shape
export const BaseNodeShapeComponent = ({ shape }: { shape: any }) => {
  const { props } = shape

  const getNodeContent = () => {
    switch (props.nodeType) {
      case 'text':
        return (
          <div className="w-full h-full p-3 bg-white border border-gray-300 rounded shadow-sm">
            <div className="text-sm text-gray-700">{props.content || 'Text node'}</div>
          </div>
        )
      case 'image':
        return (
          <div className="w-full h-full bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <img
              src={props.src || 'https://via.placeholder.com/200x150'}
              alt="Node image"
              className="w-full h-full object-cover"
            />
          </div>
        )
      case 'html':
        return (
          <div className="w-full h-full p-3 bg-white border border-gray-300 rounded shadow-sm">
            <div className="text-sm text-gray-500 text-center">[HTML Content]</div>
          </div>
        )
      case 'folder':
        return (
          <div className="w-full h-full bg-blue-50 border-2 border-blue-300 rounded shadow-sm">
            <div className="p-3 border-b border-blue-200 bg-blue-100">
              <h3 className="font-medium text-blue-900 text-sm">
                {props.content || 'Folder'} ({props.children?.length || 0})
              </h3>
            </div>
            <div className="p-2">
              <div className="text-xs text-blue-600">
                {props.view === 'compact' ? 'Compact View' : 'Window View'}
              </div>
            </div>
          </div>
        )
      default:
        return <div>Unknown node type</div>
    }
  }

  return (
    <div className="risspo-node" style={{ width: '100%', height: '100%' }}>
      {getNodeContent()}
    </div>
  )
}
