import React from 'react'
import { BaseNode, NodeProps } from '../types/canvas'
import TextNode from './TextNode'
import MediaNode from './MediaNode'
import HTMLNode from './HTMLNode'
import FolderNode from './FolderNode'

interface NodeFactoryProps extends Omit<NodeProps, 'node'> {
  node: BaseNode
  allNodes?: BaseNode[]
  onAddToFolder?: (childId: string, folderId: string) => void
  onToggleToWindow?: (nodeId: string) => void
  externalEditing?: boolean
  onEditingDone?: () => void
}

const NodeFactory: React.FC<NodeFactoryProps> = (props) => {
  const { node, ...nodeProps } = props

  const Icon: React.FC<{ type: BaseNode['type'], size?: number }> = ({ type, size = 64 }) => {
    const common = { width: size, height: size }
    switch (type) {
      case 'text':
        return (
          <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="48" height="44" rx="6" fill="#FDE68A" />
            <path d="M18 22h28M18 30h28M18 38h18" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'media':
        return (
          <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="48" height="44" rx="6" fill="#BFDBFE" />
            <circle cx="26" cy="30" r="6" fill="#1E3A8A" />
            <path d="M18 44l10-12 8 10 10-14" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'html':
        return (
          <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="48" height="44" rx="6" fill="#D1FAE5" />
            <path d="M24 22l-4 8 4 8" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 22l4 8-4 8" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'folder':
        return (
          <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="18" width="48" height="30" rx="4" fill="#FEE2E2" />
            <path d="M8 22h16l4 4h28" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      default:
        return null
    }
  }

  switch (node.type) {
    case 'text':
      if (!node.view || node.view === 'compact') {
        const THUMB = 96
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
            onPointerDown={() => { if (props.onSelect) props.onSelect(node.id) }}
            onDoubleClick={() => { if (props.onToggleToWindow) props.onToggleToWindow(node.id) }}
          >
            <div style={{ width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', pointerEvents: 'none' }}>
              <Icon type={node.type} size={56} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#111', width: THUMB, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title || node.content}</div>
          </div>
        )
      }
      return <TextNode {...(nodeProps as NodeProps)} node={node} externalEditing={props.externalEditing} onEditingDone={props.onEditingDone} />
    case 'media':
      if (!node.view || node.view === 'compact') {
        const THUMB = 96
        const isImageLike = (node.file && node.file.type && node.file.type.startsWith('image/')) || (node.fileUrl && /\.(svg|gif|png|jpe?g)$/i.test(node.fileUrl))
        const isVideoLike = (node.file && node.file.type && node.file.type.startsWith('video/')) || (node.fileUrl && /\.(mp4|webm|ogg)$/i.test(node.fileUrl))
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2"
            style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
            onPointerDown={() => { if (props.onSelect) props.onSelect(node.id) }}
            onDoubleClick={() => { if (props.onToggleToWindow) props.onToggleToWindow(node.id) }}
          >
            <div style={{ width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', pointerEvents: 'none' }}>
              {node.fileUrl && isImageLike ? (
                <img src={node.fileUrl} alt={node.content} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
              ) : node.fileUrl && isVideoLike ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <video src={node.fileUrl} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7L8 5z" fill="#fff"/></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Icon type={node.type} size={64} />
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#111', width: THUMB, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title || node.content}</div>
          </div>
        )
      }
      return <MediaNode {...(nodeProps as NodeProps)} node={node} />
    case 'html':
      if (!node.view || node.view === 'compact') {
        const THUMB = 96
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
            onPointerDown={() => { if (props.onSelect) props.onSelect(node.id) }}
            onDoubleClick={() => { if (props.onToggleToWindow) props.onToggleToWindow(node.id) }}
          >
            <div style={{ width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', pointerEvents: 'none' }}>
              <Icon type={node.type} size={56} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#111', width: THUMB, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title || node.content}</div>
          </div>
        )
      }
      return <HTMLNode {...(nodeProps as NodeProps)} node={node} />
    case 'folder':
      if (!node.view || node.view === 'compact') {
        const THUMB = 96
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
            onPointerDown={() => { if (props.onSelect) props.onSelect(node.id) }}
            onDoubleClick={() => { if (props.onToggleToWindow) props.onToggleToWindow(node.id) }}
          >
            <div style={{ width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', pointerEvents: 'none' }}>
              <Icon type={node.type} size={56} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#111', width: THUMB, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title || node.content}</div>
          </div>
        )
      }
      return <FolderNode {...(nodeProps as NodeProps)} node={node} allNodes={props.allNodes} onAddToFolder={props.onAddToFolder} />
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return null
  }
}

export default NodeFactory
