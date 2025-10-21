export type KeyAction =
  | { type: 'DELETE_SELECTED' }
  | { type: 'DUPLICATE_SELECTED' }
  | { type: 'SAVE' }
  | { type: 'DESELECT_ALL' }
  | { type: 'ZOOM_PRESET'; scale: number }

export function mapKeyDown(e: KeyboardEvent): KeyAction | null {
  // Space and Alt are handled by the canvas to toggle panning/snap overrides
  if (e.key === 'Delete' || e.key === 'Backspace') {
    return { type: 'DELETE_SELECTED' }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    return { type: 'DUPLICATE_SELECTED' }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    return { type: 'SAVE' }
  }
  if (e.key === 'Escape') {
    return { type: 'DESELECT_ALL' }
  }
  if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
    const scale = e.key === '1' ? 1 : e.key === '2' ? 0.5 : 2
    return { type: 'ZOOM_PRESET', scale }
  }
  return null
}
