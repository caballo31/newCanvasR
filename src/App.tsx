import React from 'react'
import { CanvasPage } from './components/canvas/CanvasPage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './App.css'

function App() {
  useKeyboardShortcuts()

  return (
    <div className="App">
      <CanvasPage />
    </div>
  )
}

export default App
