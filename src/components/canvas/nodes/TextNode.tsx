import React, { useState, useRef, useEffect } from 'react'
import { NodeProps } from '../types/canvas'

const TextNode: React.FC<NodeProps> = ({ 
  node, 
  onSelect,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(node.content || '')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // keep local value in sync if external changes happen
    setValue(node.content || '')
  }, [node.content])

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

  const isWindow = node.view === 'window'

  return (
    <div
      data-node-id={node.id}
      style={{ width: '100%', height: '100%', position: 'relative', userSelect: isEditing ? 'text' : 'none' }}
      onClick={() => onSelect(node.id)}
    >
      {/* Window-mode: styled note with view / edit modes */}
      {isWindow ? (
        <div className="w-full h-full p-3" style={{ boxSizing: 'border-box' }}>
          {!isEditing ? (
            <div
              className="w-full h-full p-3 bg-yellow-50 rounded-md shadow-inner overflow-auto"
              style={{ whiteSpace: 'pre-wrap', color: '#1f2937', fontSize: 14 }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {node.content}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => save()}
              onKeyDown={onKeyDown}
              className="w-full h-full p-3 rounded-md border border-gray-200"
              style={{ resize: 'none', boxSizing: 'border-box', fontSize: 14 }}
            />
          )}
        </div>
      ) : (
        /* compact or other views: simple centered label */
        <div className="w-full h-full p-4 flex items-center justify-center">
          <div className="text-lg text-gray-800 font-light">
            {node.content}
          </div>
        </div>
      )}
    </div>
  )
}

export default TextNode
