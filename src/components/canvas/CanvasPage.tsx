import React from 'react'
import { RisspoCanvas } from './RisspoCanvas'
import { Toolbar, ToolbarGroup } from '../ui/toolbar'
import { Button } from '../ui/button'
import { useCanvasStore } from '../../stores/useCanvasStore'
import { generateId } from '../../lib/utils'
import { Folder, Image, Type, Code } from 'lucide-react'

export const CanvasPage: React.FC = () => {
  const { addNode } = useCanvasStore()

  const handleAddText = () => {
    addNode({
      id: generateId(),
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      content: 'New text node',
    })
  }

  const handleAddImage = () => {
    addNode({
      id: generateId(),
      type: 'image',
      x: 150,
      y: 150,
      width: 200,
      height: 150,
      src: 'https://via.placeholder.com/200x150',
      alt: 'Placeholder image',
    })
  }

  const handleAddHTML = () => {
    addNode({
      id: generateId(),
      type: 'html',
      x: 200,
      y: 200,
      width: 250,
      height: 120,
      content: '<div>HTML content placeholder</div>',
    })
  }

  const handleAddFolder = () => {
    addNode({
      id: generateId(),
      type: 'folder',
      x: 250,
      y: 250,
      width: 300,
      height: 200,
      view: 'compact',
      children: [],
    })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Toolbar>
        <ToolbarGroup>
          <Button variant="outline" size="sm" onClick={handleAddText}>
            <Type className="w-4 h-4 mr-2" />
            Text
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddImage}>
            <Image className="w-4 h-4 mr-2" />
            Image
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddHTML}>
            <Code className="w-4 h-4 mr-2" />
            HTML
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddFolder}>
            <Folder className="w-4 h-4 mr-2" />
            Folder
          </Button>
        </ToolbarGroup>
      </Toolbar>
      <div className="flex-1 relative">
        <RisspoCanvas />
      </div>
    </div>
  )
}
