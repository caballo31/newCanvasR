import React from 'react'
import type { BaseNode } from '../types/canvas'

export const NodeIcon: React.FC<{ type: BaseNode['type']; size?: number }> = ({
  type,
  size = 64,
}) => {
  const common = { width: size, height: size }
  switch (type) {
    case 'text':
      return (
        <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="48" height="44" rx="6" fill="#3B82F6" />
          <path d="M18 22h28M18 30h28M18 38h18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'media':
      return (
        <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="48" height="44" rx="6" fill="#10B981" />
          <circle cx="26" cy="30" r="6" fill="#ffffff" />
          <path d="M18 44l10-12 8 10 10-14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'html':
      return (
        <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="48" height="44" rx="6" fill="#F97316" />
          <path d="M24 22l-4 8 4 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 22l4 8-4 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="18" width="48" height="30" rx="4" fill="#FBBF24" />
          <path d="M8 22h16l4 4h28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

export const CompactThumb: React.FC<{
  type: BaseNode['type']
  title?: string | null | undefined
  label?: string | null | undefined
}> = ({ type, title, label }) => {
  const THUMB = 72
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ boxSizing: 'border-box', padding: 8, cursor: 'pointer', userSelect: 'none' }}
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
        <NodeIcon type={type} size={42} />
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
        {title || label}
      </div>
    </div>
  )
}

export default NodeIcon
