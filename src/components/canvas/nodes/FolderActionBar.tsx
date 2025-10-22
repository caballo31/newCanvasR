import React from 'react'
import { Trash, Copy, ExternalLink } from 'lucide-react'

interface Props {
  selectedIds: string[]
  contextLabel: string
  onDelete: (ids: string[]) => void
  onDuplicate: (ids: string[]) => void
  onOpen: (ids: string[]) => void
  isFocused?: boolean
}

const FolderActionBar: React.FC<Props> = ({ selectedIds, contextLabel, onDelete, onDuplicate, onOpen, isFocused = true }) => {
  const hasNone = selectedIds.length === 0
  const hasOne = selectedIds.length === 1
  const disabled = hasNone || !isFocused

  return (
    <div
      style={{ position: 'sticky', top: 52, zIndex: 10 }}
      className="bg-white border-b border-gray-200"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`w-full h-12 flex items-center justify-between px-2`}>
        <div className={`text-sm font-medium text-gray-700 ${disabled ? 'opacity-40' : ''}`}>{contextLabel}</div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => onOpen(selectedIds)}
            disabled={!hasOne || disabled}
            title="Abrir"
            aria-disabled={!hasOne || disabled}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
          </button>
          <button
            onClick={() => onDuplicate(selectedIds)}
            disabled={disabled}
            title="Duplicar"
            aria-disabled={disabled}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={() => onDelete(selectedIds)}
            disabled={disabled}
            title="Eliminar"
            aria-disabled={disabled}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-red-100 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FolderActionBar
