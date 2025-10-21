import React, { useEffect, useState, useRef } from 'react'
import { NodeProps } from '../types/canvas'
import { Code, Edit, Save, X } from 'lucide-react'

const HTMLNode: React.FC<NodeProps> = ({ node, onEdit, externalEditing, onEditingDone }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(node.content || '')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // When externalEditing prop changes to true, open editor
  useEffect(() => {
    if (externalEditing) setIsEditing(true)
  }, [externalEditing])

  useEffect(() => {
    setValue(node.content || '')
  }, [node.content])

  const save = () => {
    if (onEdit) onEdit(node.id, value)
    setIsEditing(false)
    onEditingDone && onEditingDone()
  }

  const cancel = () => {
    setValue(node.content || '')
    setIsEditing(false)
    onEditingDone && onEditingDone()
  }

  const isWindow = node.view === 'window' || node.view === 'fullscreen'

  return (
    <div
      data-node-id={node.id}
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}
    >
      {!isEditing ? (
        // Render mode: show iframe with srcDoc so HTML executes safely inside node bounds
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {/* In compact mode we keep a simple placeholder */}
          {!isWindow ? (
            <div
              className="w-full h-full flex items-center justify-center p-4 bg-gray-50 rounded-lg"
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-center">
                <Code size={24} className="text-gray-400 mb-2 mx-auto" />
                <div className="text-sm text-gray-600">{node.content}</div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <iframe
                title={`html-node-${node.id}`}
                srcDoc={node.content || ''}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
              {/* small floating edit button in window/fullscreen */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  zIndex: 50,
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: 6,
                  borderRadius: 8,
                }}
                aria-label="Editar HTML"
              >
                <Edit size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        // Edit mode: full textarea with save/cancel
        <div style={{ width: '100%', height: '100%', padding: 8, boxSizing: 'border-box' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ width: '100%', height: 'calc(100% - 44px)', resize: 'none', fontFamily: 'monospace' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                save()
              }}
              className="px-3 py-1 bg-green-600 text-white rounded-md"
            >
              <Save size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                cancel()
              }}
              className="px-3 py-1 bg-gray-200 text-black rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HTMLNode
