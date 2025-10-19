import { useEffect } from 'react'
import { useCanvasStore } from '../stores/useCanvasStore'

export const useKeyboardShortcuts = () => {
  const { selectedNodes, removeNode } = useCanvasStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodes.length > 0) {
          event.preventDefault()
          selectedNodes.forEach((nodeId) => removeNode(nodeId))
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault()
        console.log('Duplicate nodes:', selectedNodes)
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        console.log('Save snapshot')
      }

      if (event.key === 'Escape') {
        console.log('Deselect all')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, removeNode])
}
