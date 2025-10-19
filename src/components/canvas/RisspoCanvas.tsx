import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Type, FileImage, Code, Folder } from 'lucide-react'
import { BaseNode, Viewport } from '../../types/canvas'
import NodeFactory from './nodes/NodeFactory'
import ResizeHandles from './nodes/ResizeHandles'

const RisspoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nodes, setNodes] = useState<BaseNode[]>([])
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isDraggingViewport, setIsDraggingViewport] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Generar ID único
  const generateId = (): string => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Abrir selector de archivos para nodo Media
  const openFileSelector = (nodeId?: string): void => {
    if (nodeId) {
      setSelectedNode(nodeId)
    }
    fileInputRef.current?.click()
  }

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    if (selectedNode) {
      // Actualizar nodo existente
      setNodes(prev => prev.map(node => 
        node.id === selectedNode 
          ? { 
              ...node, 
              content: file.name,
              file: file,
              fileUrl: URL.createObjectURL(file)
            }
          : node
      ))
    } else {
      // Crear nuevo nodo
      createNode('media', file)
    }
    
    // Limpiar input
    e.target.value = ''
  }

  // Crear nuevo nodo - POSICIÓN CORREGIDA
  const createNode = (type: BaseNode['type'], file?: File): void => {
    // Calcular posición en el centro del viewport VISUAL
    const viewportCenterX = window.innerWidth / 2 / viewport.scale - viewport.x / viewport.scale
    const viewportCenterY = window.innerHeight / 2 / viewport.scale - viewport.y / viewport.scale
    
    const defaultSizes = {
      text: { width: 200, height: 100 },
      media: { width: 200, height: 150 },
      html: { width: 250, height: 120 },
      folder: { width: 300, height: 200 }
    }

    const newNode: BaseNode = {
      id: generateId(),
      type,
      x: viewportCenterX - defaultSizes[type].width / 2, // Centrado correcto
      y: viewportCenterY - defaultSizes[type].height / 2, // Centrado correcto
      width: defaultSizes[type].width,
      height: defaultSizes[type].height,
      content: type === 'text' ? 'Texto' : type === 'media' ? file?.name || 'Media' : type === 'html' ? 'HTML' : 'Carpeta',
      file: file || null,
      fileUrl: file ? URL.createObjectURL(file) : undefined
    }
    setNodes(prev => [...prev, newNode])
  }

  // Duplicar nodo
  const duplicateNode = (nodeId: string): void => {
    const nodeToDuplicate = nodes.find(node => node.id === nodeId)
    if (!nodeToDuplicate) return

    const duplicatedNode: BaseNode = {
      ...nodeToDuplicate,
      id: generateId(),
      x: nodeToDuplicate.x + 20,
      y: nodeToDuplicate.y + 20,
      isSelected: false,
      isDragging: false
    }
    setNodes(prev => [...prev, duplicatedNode])
  }

  // Eliminar nodo
  const deleteNode = (nodeId: string): void => {
    const nodeToDelete = nodes.find(node => node.id === nodeId)
    if (nodeToDelete?.fileUrl) {
      URL.revokeObjectURL(nodeToDelete.fileUrl)
    }
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  // Editar contenido del nodo
  const editNode = (nodeId: string, newContent: string): void => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, content: newContent } : node
    ))
  }

  // Actualizar nodo
  const updateNode = (nodeId: string, updates: Partial<BaseNode>): void => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }

  // Drag & drop de archivos
  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const dropX = (e.clientX - viewport.x) / viewport.scale
      const dropY = (e.clientY - viewport.y) / viewport.scale
      
      const newNode: BaseNode = {
        id: generateId(),
        type: 'media',
        x: dropX - 100,
        y: dropY - 75,
        width: 200,
        height: 150,
        content: file.name,
        file: file,
        fileUrl: URL.createObjectURL(file)
      }
      setNodes(prev => [...prev, newNode])
    }
  }

  // Manejar tecla espaciadora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab'
        }
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        deleteNode(selectedNode)
      }
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
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
  const handleMouseDown = (e: React.MouseEvent): void => {
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

    // Si clickeó en un handle de resize
    if (target.closest('[data-resize-handle]')) {
      const handle = target.closest('[data-resize-handle]') as HTMLElement
      const handleType = handle.dataset.resizeHandle
      const nodeId = handle.closest('[data-node-id]')?.getAttribute('data-node-id')
      
      if (handleType && nodeId) {
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          setResizeHandle(handleType)
          setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: node.width,
            height: node.height
          })
          setSelectedNode(nodeId)
        }
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
  const handleMouseMove = (e: React.MouseEvent): void => {
    // Mover viewport si está en modo arrastre de viewport
    if (isDraggingViewport) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      return
    }

    // Resize del nodo
    if (resizeHandle && selectedNode) {
      const deltaX = (e.clientX - resizeStart.x) / viewport.scale
      const deltaY = (e.clientY - resizeStart.y) / viewport.scale
      
      setNodes(prev => prev.map(node => {
        if (node.id !== selectedNode) return node
        
        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        
        switch (resizeHandle) {
          case 'e':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            break
          case 'w':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            break
          case 's':
            newHeight = Math.max(50, resizeStart.height + deltaY)
            break
          case 'n':
            newHeight = Math.max(50, resizeStart.height - deltaY)
            break
          case 'se':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            newHeight = Math.max(50, resizeStart.height + deltaY)
            break
          case 'sw':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            newHeight = Math.max(50, resizeStart.height + deltaY)
            break
          case 'ne':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            newHeight = Math.max(50, resizeStart.height - deltaY)
            break
          case 'nw':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            newHeight = Math.max(50, resizeStart.height - deltaY)
            break
        }
        
        return { ...node, width: newWidth, height: newHeight }
      }))
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
  const handleMouseUp = (): void => {
    setIsDraggingViewport(false)
    setResizeHandle(null)
    
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
  const handleWheel = (e: React.WheelEvent): void => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    const newScale = Math.min(Math.max(0.1, viewport.scale + delta), 3)
    
    setViewport(prev => ({
      ...prev,
      scale: newScale
    }))
  }

  // Renderizar nodos a través del factory - CORREGIDO: contenedor unificado
  const renderNodes = (): JSX.Element[] => {
    return nodes.map(node => {
      const isSelected = node.id === selectedNode
      const nodeStyle = {
        position: 'absolute' as const,
        left: (node.x + viewport.x) * viewport.scale,
        top: (node.y + viewport.y) * viewport.scale,
        width: node.width * viewport.scale,
        height: node.height * viewport.scale,
        transform: `scale(${viewport.scale})`,
        transformOrigin: 'top left'
      }

      return (
        <div
          key={node.id}
          style={nodeStyle}
        >
          <NodeFactory
            node={node}
            isSelected={isSelected}
            viewport={viewport}
            onSelect={setSelectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onDuplicate={duplicateNode}
            onEdit={editNode}
            onFileSelect={openFileSelector}
          />
          {isSelected && (
            <ResizeHandles 
              nodeId={node.id} 
              isSelected={isSelected} 
            />
          )}
        </div>
      )
    })
  }

  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden">
      {/* Input oculto para archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*"
        className="hidden"
      />

      {/* Toolbar minimalista */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => createNode('text')}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => openFileSelector()}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <FileImage className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => createNode('html')}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => createNode('folder')}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Folder className="w-4 h-4" />
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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

      {/* Instrucciones mínimas */}
      <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-white/80 rounded px-2 py-1 border border-gray-200">
        <div>Space + drag: mover vista • Wheel: zoom • Delete: eliminar</div>
      </div>

      {/* Estado actual */}
      <div className="absolute top-3 right-3 text-xs text-gray-500 bg-white/80 rounded px-2 py-1 border border-gray-200">
        Zoom: {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  )
}

export default RisspoCanvas
