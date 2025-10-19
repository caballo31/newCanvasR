import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Type, Image, Code, Folder } from 'lucide-react'

interface Node {
  id: string
  type: 'text' | 'image' | 'html' | 'folder'
  x: number
  y: number
  width: number
  height: number
  content?: string
  isSelected?: boolean
  isDragging?: boolean
}

const RisspoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isDraggingViewport, setIsDraggingViewport] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 })

  // Generar ID único
  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Crear nuevo nodo
  const createNode = (type: Node['type']) => {
    const newNode: Node = {
      id: generateId(),
      type,
      x: -viewport.x + (window.innerWidth / 2) - 100,
      y: -viewport.y + (window.innerHeight / 2) - 50,
      width: type === 'folder' ? 300 : type === 'html' ? 250 : type === 'image' ? 200 : 200,
      height: type === 'folder' ? 200 : type === 'image' ? 150 : type === 'html' ? 120 : 100,
      content: type === 'text' ? 'Texto' : type === 'image' ? 'Imagen' : type === 'html' ? 'HTML' : 'Carpeta'
    }
    setNodes(prev => [...prev, newNode])
  }

  // Manejar tecla espaciadora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab'
        }
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        setNodes(prev => prev.filter(node => node.id !== selectedNode))
        setSelectedNode(null)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsDraggingViewport(false)
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default'
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedNode])

  // Manejar inicio de drag (viewport o nodo)
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Si está presionada la barra espaciadora, mover viewport
    if (isSpacePressed && target === canvasRef.current) {
      setIsDraggingViewport(true)
      setDragStart({ 
        x: e.clientX - viewport.x, 
        y: e.clientY - viewport.y 
      })
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing'
      }
      return
    }

    // Si clickeó en un nodo, seleccionarlo y preparar para arrastrar
    if (target.closest('[data-node-id]')) {
      const nodeElement = target.closest('[data-node-id]') as HTMLElement
      const nodeId = nodeElement.dataset.nodeId
      
      if (nodeId) {
        setSelectedNode(nodeId)
        
        // Preparar para arrastrar nodo
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          setNodeDragStart({
            x: e.clientX,
            y: e.clientY,
            nodeX: node.x,
            nodeY: node.y
          })
          
          // Marcar nodo como siendo arrastrado
          setNodes(prev => prev.map(n => 
            n.id === nodeId ? { ...n, isDragging: true } : n
          ))
        }
      }
    } else {
      // Click en fondo vacío - deseleccionar
      setSelectedNode(null)
    }
  }

  // Manejar movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    // Mover viewport si está en modo arrastre de viewport
    if (isDraggingViewport) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      return
    }

    // Mover nodo si está siendo arrastrado
    if (selectedNode && nodeDragStart.x !== 0) {
      const deltaX = e.clientX - nodeDragStart.x
      const deltaY = e.clientY - nodeDragStart.y
      
      setNodes(prev => prev.map(node => 
        node.id === selectedNode 
          ? { 
              ...node, 
              x: nodeDragStart.nodeX + deltaX / viewport.scale,
              y: nodeDragStart.nodeY + deltaY / viewport.scale
            }
          : node
      ))
    }
  }

  // Manejar fin de drag
  const handleMouseUp = () => {
    setIsDraggingViewport(false)
    
    // Finalizar arrastre de nodo
    if (selectedNode) {
      setNodes(prev => prev.map(node => 
        node.id === selectedNode ? { ...node, isDragging: false } : node
      ))
    }
    
    setNodeDragStart({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
    
    if (canvasRef.current) {
      canvasRef.current.style.cursor = isSpacePressed ? 'grab' : 'default'
    }
  }

  // Manejar zoom con rueda
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    const newScale = Math.min(Math.max(0.1, viewport.scale + delta), 3)
    
    setViewport(prev => ({
      ...prev,
      scale: newScale
    }))
  }

  // Obtener color según tipo de nodo
  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'text': return '#3b82f6'
      case 'image': return '#10b981'
      case 'html': return '#f59e0b'
      case 'folder': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  // Renderizar nodos
  const renderNodes = () => {
    return nodes.map(node => {
      const isSelected = node.id === selectedNode
      const color = getNodeColor(node.type)
      
      return (
        <div
          key={node.id}
          data-node-id={node.id}
          style={{
            position: 'absolute',
            left: (node.x + viewport.x) * viewport.scale,
            top: (node.y + viewport.y) * viewport.scale,
            width: node.width * viewport.scale,
            height: node.height * viewport.scale,
            backgroundColor: 'white',
            border: `2px ${isSelected ? 'dashed #000' : 'solid ' + color}`,
            borderRadius: '8px',
            padding: '8px',
            cursor: node.isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            userSelect: 'none',
            opacity: node.isDragging ? 0.8 : 1,
            transition: node.isDragging ? 'none' : 'all 0.1s ease'
          }}
        >
          <div style={{
            color: color,
            fontWeight: '500',
            fontSize: Math.max(12, 14 * viewport.scale) + 'px',
            pointerEvents: 'none'
          }}>
            {node.content}
          </div>
          <div style={{
            color: '#6b7280',
            fontSize: Math.max(10, 12 * viewport.scale) + 'px',
            marginTop: '4px',
            pointerEvents: 'none'
          }}>
            {node.type.toUpperCase()}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="w-full h-full bg-gray-100 relative overflow-hidden">
      {/* Toolbar minimalista */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => createNode('text')}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Texto
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => createNode('image')}
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Imagen
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => createNode('html')}
            className="flex items-center gap-2"
          >
            <Code className="w-4 h-4" />
            HTML
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => createNode('folder')}
            className="flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            Carpeta
          </Button>
        </div>
      </div>

      {/* Canvas infinito */}
      <div
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          background: `
            linear-gradient(45deg, #f8fafc 25%, transparent 25%),
            linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f8fafc 75%),
            linear-gradient(-45deg, transparent 75%, #f8fafc 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          cursor: isSpacePressed ? 'grab' : 'default'
        }}
      >
        {renderNodes()}
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white/90 rounded px-3 py-2 border border-gray-200">
        <div>🖱️ Arrastra nodos para mover</div>
        <div>🔍 Rueda para zoom</div>
        <div>🎯 Click para seleccionar</div>
        <div>⌫ Delete para eliminar</div>
        <div className="font-semibold mt-1">🚀 Barra espaciadora + arrastre para mover vista</div>
      </div>

      {/* Estado actual */}
      <div className="absolute top-4 right-4 text-xs text-gray-500 bg-white/90 rounded px-2 py-1">
        <div>Zoom: {Math.round(viewport.scale * 100)}%</div>
        <div>Modo: {isSpacePressed ? 'Mover Vista' : 'Seleccionar'}</div>
      </div>
    </div>
  )
}

export default RisspoCanvas
