import React, { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Type, FileImage, Code, Folder, Copy, Edit, Trash } from 'lucide-react'
import { BaseNode, Viewport } from './types/canvas'
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
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  // which node had its header clicked (shows resize handles / enables dragging)
  const [headerActive, setHeaderActive] = useState<string | null>(null)

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
      fileUrl: file ? URL.createObjectURL(file) : undefined,
      view: 'compact'
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
    const draggedNodeId = e.dataTransfer.getData('text/node-id')
    if (draggedNodeId) {
      // Move existing node to this drop position and remove parent
      const dropX = (e.clientX - viewport.x) / viewport.scale
      const dropY = (e.clientY - viewport.y) / viewport.scale
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: dropX, y: dropY, parent: undefined } : n))
      // Also remove from any folder children arrays
      setNodes(prev => prev.map(n => n.children ? { ...n, children: n.children.filter(id => id !== draggedNodeId) } : n))
      return
    }

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
    
    const handlePointerUp = (): void => {
      setIsDraggingViewport(false)
      setResizeHandle(null)
      setNodeDragStart({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
      if (canvasRef.current) canvasRef.current.style.cursor = 'default'
    }

    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('pointerup', handlePointerUp)
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

    // If clicked on a node header -> select + prepare to drag
    const headerEl = target.closest('[data-drag-handle]') as HTMLElement | null
    if (headerEl) {
      const nodeElement = headerEl.closest('[data-node-id]') as HTMLElement | null
      const nodeId = nodeElement?.dataset.nodeId
      if (nodeId) {
        setSelectedNode(nodeId)
        setHeaderActive(nodeId)
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          setNodeDragStart({
            x: e.clientX,
            y: e.clientY,
            nodeX: node.x,
            nodeY: node.y
          })
          setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isDragging: true } : n))
        }
      }
      return
    }

    // If clicked inside a node but not on header: just select (allow internal interactions)
    if (target.closest('[data-node-id]')) {
      const nodeElement = target.closest('[data-node-id]') as HTMLElement
      const nodeId = nodeElement.dataset.nodeId
      if (nodeId) {
        setSelectedNode(nodeId)
        // do not start drag; header must be used to drag
        setHeaderActive(null)
      }
      return
    }

    // Click on empty canvas: deselect
    setSelectedNode(null)
    setHeaderActive(null)
  }

  // Manejar movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent): void => {
    setPointerPos({ x: e.clientX, y: e.clientY })
    // Mover viewport si está en modo arrastre de viewport
    if (isDraggingViewport) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      return
    }

    // Resize del nodo - CORREGIDO: aplicar transformación de viewport
    if (resizeHandle && selectedNode) {
      const deltaX = (e.clientX - resizeStart.x) / viewport.scale
      const deltaY = (e.clientY - resizeStart.y) / viewport.scale
      
      setNodes(prev => prev.map(node => {
        if (node.id !== selectedNode) return node
        
        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = node.x
        let newY = node.y
        
        switch (resizeHandle) {
          case 'e':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            break
          case 'w':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            newX = node.x + deltaX
            break
          case 's':
            newHeight = Math.max(50, resizeStart.height + deltaY)
            break
          case 'n':
            newHeight = Math.max(50, resizeStart.height - deltaY)
            newY = node.y + deltaY
            break
          case 'se':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            newHeight = Math.max(50, resizeStart.height + deltaY)
            break
          case 'sw':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            newHeight = Math.max(50, resizeStart.height + deltaY)
            newX = node.x + deltaX
            break
          case 'ne':
            newWidth = Math.max(50, resizeStart.width + deltaX)
            newHeight = Math.max(50, resizeStart.height - deltaY)
            newY = node.y + deltaY
            break
          case 'nw':
            newWidth = Math.max(50, resizeStart.width - deltaX)
            newHeight = Math.max(50, resizeStart.height - deltaY)
            newX = node.x + deltaX
            newY = node.y + deltaY
            break
        }
        
        return { ...node, width: newWidth, height: newHeight, x: newX, y: newY }
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

  // Manejar fin de drag - CORREGIDO: cursor siempre se restaura a default
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
      canvasRef.current.style.cursor = 'default'
    }

    // Detect drop into folder: si el nodo seleccionado se soltó sobre un folder, añadilo como child
    if (selectedNode) {
      try {
        const el = document.elementFromPoint(pointerPos.x, pointerPos.y) as HTMLElement | null
        const folderEl = el?.closest('[data-node-id]') as HTMLElement | null
        const folderId = folderEl?.getAttribute('data-node-id')
        if (folderId && folderId !== selectedNode) {
          const folderNode = nodes.find(n => n.id === folderId)
          if (folderNode && folderNode.type === 'folder') {
            // move selectedNode inside folder
            updateNode(selectedNode, { parent: folderId })
            const newChildren = Array.from(new Set([...(folderNode.children || []), selectedNode]))
            updateNode(folderId, { children: newChildren })
          }
        }
      } catch {}
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

  // Actualiza el renderizado de nodos
  const COMPACT_SIZE = { width: 120, height: 80 }

  const toggleToWindow = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    if (node.view === 'compact' || !node.view) {
      updateNode(nodeId, { view: 'window' })
    } else if (node.view === 'window') {
      updateNode(nodeId, { view: 'fullscreen' })
    }
  }

  const setCompact = (nodeId: string) => updateNode(nodeId, { view: 'compact' })
  const setFullscreen = (nodeId: string) => updateNode(nodeId, { view: 'fullscreen' })
  const setWindow = (nodeId: string) => updateNode(nodeId, { view: 'window' })

  const renderNodes = (): JSX.Element[] => {
    // render only top-level nodes (no parent)
    const topNodes = nodes.filter(n => !n.parent && n.view !== 'fullscreen')
    return topNodes.map(node => {
      const isSelected = node.id === selectedNode

      const isCompact = node.view !== 'window' && node.view !== 'fullscreen'
      const wrapperWidth = isCompact ? COMPACT_SIZE.width : node.width
      const wrapperHeight = isCompact ? COMPACT_SIZE.height : node.height

      return (
        <div
          key={node.id}
          data-node-id={node.id}
          onDoubleClick={() => toggleToWindow(node.id)}
          style={{
            position: 'absolute',
            left: `${node.x}px`,
            top: `${node.y}px`,
            width: `${wrapperWidth}px`,
            height: `${wrapperHeight}px`,
            userSelect: 'none',
          }}
        >
          {/* contenedor relativo: contenido del nodo debe usar solo width/height 100% y position:relative */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Header: visible bar used as the only drag handle and to show filename */}
            <div data-drag-handle style={{ position: 'absolute', left: 8, right: 8, top: 8, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 0 rgba(0,0,0,0.06)', zIndex: 25, cursor: 'grab', userSelect: 'none' }}>
              <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{node.content}</div>
              <div style={{ width: 24, height: 24 }} />
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, top: !isCompact ? 44 : 0, bottom: 0, overflow: 'hidden' }}>
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
                allNodes={nodes}
                onAddToFolder={(childId: string, folderId: string) => {
                  updateNode(childId, { parent: folderId })
                  // also ensure folder children array
                  const folder = nodes.find(n => n.id === folderId)
                  if (folder) {
                    const newChildren = Array.from(new Set([...(folder.children || []), childId]))
                    updateNode(folderId, { children: newChildren })
                  }
                }}
              />
            </div>

            {/* Resize handles only in window mode and when header is active (clicked) */}
            {isSelected && node.view === 'window' && headerActive === node.id && (
              <ResizeHandles
                nodeId={node.id}
                onHandlePointerDown={(handle, clientX, clientY) => {
                  setSelectedNode(node.id)
                  setResizeHandle(handle)
                  setResizeStart({ x: clientX, y: clientY, width: node.width, height: node.height })
                }}
                onHandlePointerMove={(handle, clientX, clientY) => {
                  // Only handle if this node is selected and current resize handle matches
                  if (resizeHandle && selectedNode === node.id && resizeHandle === handle) {
                    const deltaX = (clientX - resizeStart.x) / viewport.scale
                    const deltaY = (clientY - resizeStart.y) / viewport.scale
                    setNodes(prev => prev.map(n => {
                      if (n.id !== selectedNode) return n
                      let newWidth = resizeStart.width
                      let newHeight = resizeStart.height
                      let newX = n.x
                      let newY = n.y
                      switch (handle) {
                        case 'e': newWidth = Math.max(50, resizeStart.width + deltaX); break
                        case 'w': newWidth = Math.max(50, resizeStart.width - deltaX); newX = n.x + deltaX; break
                        case 's': newHeight = Math.max(50, resizeStart.height + deltaY); break
                        case 'n': newHeight = Math.max(50, resizeStart.height - deltaY); newY = n.y + deltaY; break
                        case 'se': newWidth = Math.max(50, resizeStart.width + deltaX); newHeight = Math.max(50, resizeStart.height + deltaY); break
                        case 'sw': newWidth = Math.max(50, resizeStart.width - deltaX); newHeight = Math.max(50, resizeStart.height + deltaY); newX = n.x + deltaX; break
                        case 'ne': newWidth = Math.max(50, resizeStart.width + deltaX); newHeight = Math.max(50, resizeStart.height - deltaY); newY = n.y + deltaY; break
                        case 'nw': newWidth = Math.max(50, resizeStart.width - deltaX); newHeight = Math.max(50, resizeStart.height - deltaY); newX = n.x + deltaX; newY = n.y + deltaY; break
                      }
                      return { ...n, width: newWidth, height: newHeight, x: newX, y: newY }
                    }))
                  }
                }}
              />
            )}
          </div>
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
        onPointerMove={(e) => {
          // forward pointer moves to the same handler (normalize to MouseEvent shape)
          handleMouseMove(e as unknown as React.MouseEvent)
        }}
        onPointerUp={() => handleMouseUp()}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {renderNodes()}
        </div>

        {/* Floating toolbar for selected node (compact/window) */}
        {selectedNode && (() => {
          const node = nodes.find(n => n.id === selectedNode)
          if (!node) return null
          if (node.view === 'fullscreen') return null
          // compute screen position of node
          const screenX = (node.x + viewport.x) * viewport.scale
          const screenY = (node.y + viewport.y) * viewport.scale
          const left = screenX + (node.view === 'window' ?  (node.width * viewport.scale)/2 : (COMPACT_SIZE.width/2))
          // Move toolbar higher for window mode to avoid overlapping node header area
          const top = screenY - (node.view === 'window' ? 28 : 10)
          return (
            <div style={{ position: 'absolute', left, top, transform: 'translate(-50%, -100%)', zIndex: 9999, pointerEvents: 'auto' }}>
                <div className="bg-gray-800 text-white rounded-md shadow-lg p-2 flex gap-3 items-center" style={{ pointerEvents: 'auto' }}>
                  <button type="button" onPointerDown={(e) => { e.stopPropagation() }} onMouseDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }} title="Eliminar" className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center" aria-label="Eliminar">
                    <Trash size={14} />
                  </button>
                  <button type="button" onPointerDown={(e) => { e.stopPropagation() }} onMouseDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); duplicateNode(node.id) }} title="Duplicar" className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center" aria-label="Duplicar">
                    <Copy size={14} />
                  </button>
                  <button type="button" onPointerDown={(e) => { e.stopPropagation() }} onMouseDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); const newContent = prompt('Editar:', node.content); if (newContent !== null) editNode(node.id, newContent) }} title="Editar" className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center" aria-label="Editar">
                    <Edit size={14} />
                  </button>
                  <div style={{ width: 8 }} />
                  {/* minimize then expand on the right (use simple inline SVGs matching the toolbar tone) */}
                  <button type="button" onPointerDown={(e) => { e.stopPropagation() }} onMouseDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); setCompact(node.id); setSelectedNode(node.id) }} title="Minimizar" className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center" aria-label="Minimizar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                  <button type="button" onPointerDown={(e) => { e.stopPropagation() }} onMouseDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); setFullscreen(node.id); setSelectedNode(node.id) }} title="Maximizar" className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center" aria-label="Maximizar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>
                  </button>
                </div>
            </div>
          )
        })()}

        {/* Fullscreen overlay for nodes in fullscreen mode */}
        {nodes.filter(n => n.view === 'fullscreen').map(fsNode => (
          <div key={fsNode.id} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90vw', height: '90vh', background: 'white', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 600 }}>{fsNode.content}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setCompact(fsNode.id)} title="Minimizar">_</button>
                  <button onClick={() => setWindow(fsNode.id)} title="Restaurar">▢</button>
                  <button onClick={() => setWindow(fsNode.id)}>Cerrar</button>
                </div>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 36, bottom: 0 }}>
                <NodeFactory node={fsNode} isSelected={selectedNode === fsNode.id} viewport={viewport} onSelect={setSelectedNode} onUpdate={updateNode} onDelete={deleteNode} onDuplicate={duplicateNode} onEdit={editNode} onFileSelect={openFileSelector} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RisspoCanvas