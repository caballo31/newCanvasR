import React from 'react'
import type { BaseNode, Viewport } from './types/canvas'
import NodeFactory from './nodes/NodeFactory'
import { UploadCloud, Edit } from 'lucide-react'

interface FullscreenOverlayProps {
  node: BaseNode
  isSelected: boolean
  viewport: Viewport
  titleEdit: { id: string | null; value: string }
  setTitleEdit: (v: { id: string | null; value: string }) => void
  onSaveTitle: (nodeId: string, newTitle: string) => void
  onRequestEdit: (nodeId: string) => void
  onRestore: (nodeId: string) => void
  onClose: (nodeId: string) => void
  // node factory callbacks
  onSelect: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<BaseNode>) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onEdit: (nodeId: string, newContent: string) => void
  onFileSelect: (nodeId?: string) => void
  onToggleToWindow: (nodeId: string) => void
  externalEditing?: boolean
  onEditingDone?: () => void
}

const FullscreenOverlay: React.FC<FullscreenOverlayProps> = ({
  node,
  isSelected,
  viewport,
  titleEdit,
  setTitleEdit,
  onSaveTitle,
  onRequestEdit,
  onRestore,
  onClose,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  onFileSelect,
  onToggleToWindow,
  externalEditing,
  onEditingDone,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '90vw',
          height: '90vh',
          background: 'white',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 12px 0 12px',
            borderBottom: '1px solid #eee',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            const target = e.target as HTMLElement
            if (target.closest('[data-title]')) {
              setTitleEdit({ id: node.id, value: (node.title || node.content || '') as string })
              return
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                display: 'grid',
                gridTemplateColumns: 'repeat(2,3px)',
                gap: 2,
              }}
            >
              <span
                style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }}
              />
              <span
                style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }}
              />
              <span
                style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }}
              />
              <span
                style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }}
              />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {titleEdit.id === node.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={titleEdit.value}
                    onChange={(e) => setTitleEdit({ id: node.id, value: e.target.value })}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ fontSize: 14, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <button
                    onClick={() => onSaveTitle(node.id, titleEdit.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="px-3 py-1 text-white"
                    style={{ background: '#F68C1E', borderRadius: 8, border: 'none' }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <span data-title>{node.title || node.content}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRequestEdit(node.id)
              }}
              title={node.type === 'media' ? 'Reemplazar' : 'Editar'}
              style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}
            >
              {node.type === 'media' ? <UploadCloud size={16} /> : <Edit size={16} />}
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onRestore(node.id)}
              title="Restaurar"
              className="p-2 rounded-sm hover:bg-gray-100"
              aria-label="Restaurar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => onClose(node.id)}
              title="Cerrar"
              style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 56, bottom: 0 }}>
          <NodeFactory
            node={node}
            isSelected={isSelected}
            viewport={viewport}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onFileSelect={onFileSelect}
            onToggleToWindow={onToggleToWindow}
            externalEditing={externalEditing}
            onEditingDone={onEditingDone}
          />
        </div>
      </div>
    </div>
  )
}

export default FullscreenOverlay
