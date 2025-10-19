import React from 'react';

interface ResizeHandlesProps {
  nodeId: string;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = () => {
  const handles = [
    { position: 'nw', cursor: 'nw-resize' },
    { position: 'n', cursor: 'n-resize' },
    { position: 'ne', cursor: 'ne-resize' },
    { position: 'w', cursor: 'w-resize' },
    { position: 'e', cursor: 'e-resize' },
    { position: 'sw', cursor: 'sw-resize' },
    { position: 's', cursor: 's-resize' },
    { position: 'se', cursor: 'se-resize' }
  ];

  const getHandleStyle = (position: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'white',
      border: '2px solid #2196f3',
      borderRadius: '50%',
      pointerEvents: 'all',
      cursor: handles.find(h => h.position === position)?.cursor || 'default',
      zIndex: 1000,
    };

    switch (position) {
      case 'nw': return { ...baseStyle, left: '-4px', top: '-4px' };
      case 'n': return { ...baseStyle, left: '50%', top: '-4px', transform: 'translateX(-50%)' };
      case 'ne': return { ...baseStyle, right: '-4px', top: '-4px' };
      case 'w': return { ...baseStyle, left: '-4px', top: '50%', transform: 'translateY(-50%)' };
      case 'e': return { ...baseStyle, right: '-4px', top: '50%', transform: 'translateY(-50%)' };
      case 'sw': return { ...baseStyle, left: '-4px', bottom: '-4px' };
      case 's': return { ...baseStyle, left: '50%', bottom: '-4px', transform: 'translateX(-50%)' };
      case 'se': return { ...baseStyle, right: '-4px', bottom: '-4px' };
      default: return baseStyle;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {handles.map(({ position }) => (
        <div
          key={position}
          data-resize-handle={position}
          style={getHandleStyle(position)}
          className="resize-handle"
        />
      ))}
    </div>
  );
};

export default ResizeHandles;
