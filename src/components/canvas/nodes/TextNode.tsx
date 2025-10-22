import React, { useState, useRef, useEffect } from 'react'
import { NodeProps } from '../types/canvas'

interface TextNodeExProps extends NodeProps {
  externalEditing?: boolean
  onEditingDone?: () => void
}

const TextNode: React.FC<TextNodeExProps> = ({ node, onEdit, externalEditing, onEditingDone }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(node.content || '')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // keep local value in sync if external changes happen
    setValue(node.content || '')
  }, [node.content])

  useEffect(() => {
    // If external editing flag is set, enter edit mode
    if (externalEditing) {
      setIsEditing(true)
    }
  }, [externalEditing])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // place caret at end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const save = () => {
    setIsEditing(false)
    if (value !== node.content) {
      onEdit(node.id, value)
    }
    if (onEditingDone) onEditingDone()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') {
      setValue(node.content || '')
      setIsEditing(false)
    }
  }

  const isWindow = node.view === 'window' || node.view === 'fullscreen'

  return (
    <div
      data-node-id={node.id}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        userSelect: isEditing ? 'text' : 'none',
      }}
    >
      {/* Window-mode: styled note with view / edit modes */}
      {isWindow ? (
        <div className="w-full h-full" style={{ boxSizing: 'border-box' }}>
          {!isEditing ? (
            <div className="w-full h-full flex flex-col gap-2 p-2 bg-yellow-50 rounded-md overflow-auto"
              style={{
                color: '#1f2937',
                fontSize: 14,
                boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02)',
              }}
              onDoubleClick={() => setIsEditing(true)}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{node.content}</div>
              {Array.isArray((node as any).tags) && (node as any).tags.length > 0 && (
                <div className="mt-auto pt-2 border-t border-yellow-100 flex flex-wrap gap-1">
                  {((node as any).tags as string[]).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 text-[11px] rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full h-full p-2 rounded-md border border-gray-200"
                style={{ resize: 'none', boxSizing: 'border-box', fontSize: 14 }}
              />
              {/* Save button for body edits (brand color #F68C1E) */}
              <button
                onClick={() => save()}
                className="px-3 py-1 text-white"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  background: '#F68C1E',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>
      ) : (
        /* compact or other views: simple centered label */
        <div className="w-full h-full p-4 flex items-center justify-center">
          <div className="text-lg text-gray-800 font-light">{node.content}</div>
        </div>
      )}
    </div>
  )
}

export default TextNode
