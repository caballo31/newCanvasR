import React, { memo, Suspense } from 'react'
import { BaseNode, NodeProps } from '../types/canvas'
import { CompactThumb, NodeIcon } from './NodeIcons'
const TextNode = React.lazy(() => import('./TextNode'))
const MediaNode = React.lazy(() => import('./MediaNode'))
const HTMLNode = React.lazy(() => import('./HTMLNode'))
const FolderNode = React.lazy(() => import('./FolderNode'))

interface NodeFactoryProps extends Omit<NodeProps, 'node'> {
  node: BaseNode
  allNodes?: BaseNode[]
  onAddToFolder?: (childId: string, folderId: string) => void
  onToggleToWindow?: (nodeId: string) => void
  externalEditing?: boolean
  onEditingDone?: () => void
  onClearSelection?: () => void
}

const NodeFactoryComponent: React.FC<NodeFactoryProps> = (props) => {
  const { node, ...nodeProps } = props

  // Helper for media preview in compact mode
  const renderCompactMedia = () => {
    const THUMB = 72
    const isImageLike =
      (node.file && (node.file as File).type && (node.file as File).type.startsWith('image/')) ||
      (node.fileUrl && /\.(svg|gif|png|jpe?g)$/i.test(node.fileUrl))
    const isVideoLike =
      (node.file && (node.file as File).type && (node.file as File).type.startsWith('video/')) ||
      (node.fileUrl && /\.(mp4|webm|ogg)$/i.test(node.fileUrl))
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-2"
          style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
          onDoubleClick={() => {
            if (props.onToggleToWindow) props.onToggleToWindow(node.id)
          }}
        >
        <div
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            pointerEvents: 'none',
          }}
        >
          {node.fileUrl && isImageLike ? (
            <img
              src={node.fileUrl}
              alt={node.content}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          ) : node.fileUrl && isVideoLike ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <video
                src={node.fileUrl}
                preload="metadata"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="14"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 5v14l11-7L8 5z" fill="#fff" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <NodeIcon type={node.type} size={48} />
          )}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: '#111',
            width: THUMB,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.title || node.content}
        </div>
      </div>
    )
  }

  switch (node.type) {
    case 'text':
      if (!node.view || node.view === 'compact') {
        return <CompactThumb type={node.type} title={node.title} label={node.content} />
      }
      return (
        <Suspense fallback={null}>
          <TextNode
            {...(nodeProps as NodeProps)}
            node={node}
            externalEditing={props.externalEditing}
            onEditingDone={props.onEditingDone}
          />
        </Suspense>
      )
    case 'media':
      if (!node.view || node.view === 'compact') {
        return renderCompactMedia()
      }
      return (
        <Suspense fallback={null}>
          <MediaNode {...(nodeProps as NodeProps)} node={node} />
        </Suspense>
      )
    case 'html':
      if (!node.view || node.view === 'compact') {
        return <CompactThumb type={node.type} title={node.title} label={node.content} />
      }
      return (
        <Suspense fallback={null}>
          <HTMLNode {...(nodeProps as NodeProps)} node={node} />
        </Suspense>
      )
    case 'folder':
      if (!node.view || node.view === 'compact') {
        return <CompactThumb type={node.type} title={node.title} label={node.content} />
      }
      return (
        <Suspense fallback={null}>
          <FolderNode
            {...(nodeProps as NodeProps)}
            node={node}
            allNodes={props.allNodes}
            onAddToFolder={props.onAddToFolder}
            onClearSelection={props.onClearSelection}
          />
        </Suspense>
      )
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return null
  }
}

const NodeFactory = memo(NodeFactoryComponent)
export default NodeFactory
