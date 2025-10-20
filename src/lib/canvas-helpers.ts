import type { BaseNode, Viewport } from '../components/canvas/types/canvas'

export function viewportCenterOnCanvas(viewport: Viewport, winWidth: number, winHeight: number) {
  const cx = winWidth / viewport.scale / 2 - viewport.x / viewport.scale
  const cy = winHeight / viewport.scale / 2 - viewport.y / viewport.scale
  return { x: cx, y: cy }
}

export function getDefaultSize(type: BaseNode['type']): { width: number; height: number } {
  switch (type) {
    case 'text':
      return { width: 200, height: 100 }
    case 'media':
      return { width: 200, height: 150 }
    case 'html':
      return { width: 250, height: 120 }
    case 'folder':
      return { width: 300, height: 200 }
    default:
      return { width: 200, height: 120 }
  }
}

export function getWindowSize(type: BaseNode['type']): { width: number; height: number } {
  switch (type) {
    case 'text':
      return { width: 520, height: 380 }
    case 'media':
      return { width: 640, height: 420 }
    case 'html':
      return { width: 520, height: 360 }
    case 'folder':
      return { width: 700, height: 480 }
    default:
      return { width: 520, height: 360 }
  }
}
