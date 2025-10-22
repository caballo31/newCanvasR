import React from 'react'
import type { BaseNode } from './types/canvas'

interface WindowHeaderProps {
  node: BaseNode
  titleEdit: { id: string | null; value: string }
  setTitleEdit: (v: { id: string | null; value: string }) => void
  onMinimize: (nodeId: string) => void
  onMaximize: (nodeId: string) => void
  onEnterFullscreen: (nodeId: string) => void
  onSaveTitle?: (nodeId: string, value: string) => void
}

const WindowHeader: React.FC<WindowHeaderProps> = ({
  node,
  titleEdit,
  setTitleEdit,
  onMinimize,
  onMaximize,
  onEnterFullscreen,
  onSaveTitle,
}) => {
  return (
    <div
      data-drag-handle
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: 12,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        background: 'transparent',
        borderRadius: 0,
        boxShadow: 'none',
        zIndex: 25,
        cursor: 'grab',
        userSelect: 'none',
        borderBottom: '1px solid rgba(15,23,42,0.06)',
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        const target = e.target as HTMLElement
        // If the title text was double-clicked, start title edit
        if (target.closest('[data-title]')) {
          setTitleEdit({ id: node.id, value: (node.title || node.content || '') as string })
          return
        }
        // If we're currently editing this node's title, don't treat clicks as enter-fullscreen.
        if (titleEdit.id === node.id) {
          return
        }
        if (node.view === 'window') {
          onEnterFullscreen(node.id)
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* subtle grip */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(2,3px)',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <span style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 3, height: 3, background: '#CBD5E1', borderRadius: 2, display: 'block' }} />
        </div>
        {/* title editor / display */}
        <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>
          {titleEdit.id === node.id ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={titleEdit.value}
                onChange={(e) => setTitleEdit({ id: node.id, value: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onSaveTitle) {
                    onSaveTitle(node.id, titleEdit.value)
                  }
                  // Clear local title edit state
                  setTitleEdit({ id: null, value: '' })
                }}
                className="ml-1 px-3 py-1 rounded bg-orange-500 text-white text-sm hover:bg-orange-600"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span data-title>{node.title || node.content}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onMinimize(node.id)
          }}
          title="Minimizar"
          className="p-2 rounded-sm hover:bg-gray-100"
          aria-label="Minimizar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onMaximize(node.id)
          }}
          title="Maximizar"
          className="p-2 rounded-sm hover:bg-gray-100"
          aria-label="Maximizar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default WindowHeader
