import React from 'react'
import RisspoCanvas from './components/canvas/RisspoCanvas'
import './App.css'

function App() {
  return (
    <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RisspoCanvas />
    </div>
  )
}

export default App
