import { useEffect } from 'react'
import { useEditor } from '@tldraw/tldraw'

export const useDebug = () => {
  const editor = useEditor()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D para debug info
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        console.log('=== 🐛 RISSPO DEBUG INFO ===')

        // Info del store
        const store = (window as any).__RISSPO_STORE
        if (store) {
          const nodes = store.getState().nodes
          console.log('📦 Store nodes:', Object.keys(nodes).length)
          console.log('📋 Nodes details:', nodes)
        }

        // Info del editor tldraw
        const editor = (window as any).__RISSPO_EDITOR
        if (editor) {
          const shapes = editor.getCurrentPageShapes()
          console.log('🎨 Tldraw shapes count:', shapes.length)
          console.log('🖊️ Tldraw shapes:', shapes)
          console.log('🎯 Selected shapes:', editor.getSelectedShapes())
          console.log('📐 Viewport:', editor.getViewportPageBounds())
        }

        console.log('============================')
      }

      // Ctrl+Shift+C para limpiar
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        console.clear()
        console.log('🧹 Consola limpiada')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
