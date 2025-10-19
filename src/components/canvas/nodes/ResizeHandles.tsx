import React from 'react'

interface ResizeHandlesProps {
  nodeId: string
  isSelected: boolean
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ nodeId, isSelected }) => {
  if (!isSelected) return null

  const handles = [
    { position: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'e', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'w', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'ne', style: { top: -4, right: -4 } },
    { position: 'nw', style: { top: -4, left: -4 } },
    { position: 'se', style: { bottom: -4, right: -4 } },
    { position: 'sw', style: { bottom: -4, left: -4 } },
  ]

  return (
    <>
      {handles.map(({ position, style }) => (
        <div
          key={position}
          data-resize-handle={position}
          data-node-id={nodeId}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: 'white',
            border: '1px solid #3b82f6',
            borderRadius: '1px',
            cursor: `${position}-resize`,
            zIndex: 20, // Mayor z-index para estar sobre el nodo
            ...style
          }}
        />
      ))}
    </>
  )
}

export default ResizeHandles
