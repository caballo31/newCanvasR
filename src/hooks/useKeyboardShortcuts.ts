import { useEffect } from 'react'
import { useCanvasStore } from '../stores/useCanvasStore'
import { mapKeyDown } from '../lib/interactions'

export const useKeyboardShortcuts = () => {
  const { selectedNodes, removeNode } = useCanvasStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = mapKeyDown(event)
      if (!action) return
      switch (action.type) {
        case 'DELETE_SELECTED':
          if (selectedNodes.length > 0) {
            event.preventDefault()
            selectedNodes.forEach((nodeId: string) => removeNode(nodeId))
          }
          break
        case 'DUPLICATE_SELECTED':
          event.preventDefault()
          // Placeholder: duplication is handled in RisspoCanvas toolbar and via state helpers
          break
        case 'SAVE':
          event.preventDefault()
          // Placeholder: saving handled in toolbar using persistence service
          break
        case 'DESELECT_ALL':
          // Placeholder: a store action could be used when reducer is wired
          break
        case 'ZOOM_PRESET':
          event.preventDefault()
          // Placeholder: viewport zoom handled in canvas component for now
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, removeNode])
}
