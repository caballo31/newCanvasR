import React, { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Type, FileImage, Code, Folder, Copy, Edit, Trash, UploadCloud } from 'lucide-react'
import { BaseNode, Viewport } from './types/canvas'
import NodeFactory from './nodes/NodeFactory'
import ResizeHandles from './nodes/ResizeHandles'
import { generateId } from '../../lib/utils'
import { viewportCenterOnCanvas, getDefaultSize, getWindowSize } from '../../lib/canvas-helpers'

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
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [pendingEditNode, setPendingEditNode] = useState<string | null>(null)
  const [titleEdit, setTitleEdit] = useState<{ id: string | null; value: string }>({
    id: null,
    value: '',
  })

  // ID generation centralized in lib/utils to keep a consistent format across the app

  const trimName = (name: string, max = 24) => {
    if (!name) return ''
    if (name.length <= max) return name
    const extIndex = name.lastIndexOf('.')
    const ext = extIndex > -1 ? name.slice(extIndex) : ''
    const base = extIndex > -1 ? name.slice(0, extIndex) : name
    return base.slice(0, Math.max(6, max - ext.length - 3)) + '...' + ext
  }

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
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNode
            ? {
                ...node,
                content: file.name,
                title: trimName(file.name),
                file: file,
                fileUrl: URL.createObjectURL(file),
              }
            : node
        )
      )
    } else {
      // Crear nuevo nodo
      createNode('media', file)
    }

    // Limpiar input
    e.target.value = ''
  }

  // Crear nuevo nodo - POSICIÓN CORREGIDA
  const createNode = (type: BaseNode['type'], file?: File): void => {
    const center = viewportCenterOnCanvas(viewport, window.innerWidth, window.innerHeight)
    const size = getDefaultSize(type)

    const newNode: BaseNode = {
      id: generateId(),
      type,
      x: center.x - size.width / 2, // Centrado correcto
      y: center.y - size.height / 2, // Centrado correcto
      width: size.width,
      height: size.height,
      content:
        type === 'text'
          ? 'Texto'
          : type === 'media'
            ? file?.name || 'Media'
            : type === 'html'
              ? 'HTML'
              : 'Carpeta',
      title:
        type === 'text'
          ? 'Texto'
          : type === 'media'
            ? trimName(file?.name || 'Media')
            : type === 'html'
              ? 'HTML'
              : 'Carpeta',
      file: file || null,
      fileUrl: file ? URL.createObjectURL(file) : undefined,
      view: 'compact',
    }
    setNodes((prev) => [...prev, newNode])
  }

  // Duplicar nodo
  const duplicateNode = (nodeId: string): void => {
    const nodeToDuplicate = nodes.find((node) => node.id === nodeId)
    if (!nodeToDuplicate) return

    const duplicatedNode: BaseNode = {
      ...nodeToDuplicate,
      id: generateId(),
      x: nodeToDuplicate.x + 20,
      y: nodeToDuplicate.y + 20,
      isSelected: false,
      isDragging: false,
    }
    setNodes((prev) => [...prev, duplicatedNode])
  }

  // Eliminar nodo
  const deleteNode = (nodeId: string): void => {
    const nodeToDelete = nodes.find((node) => node.id === nodeId)
    if (nodeToDelete?.fileUrl) {
      URL.revokeObjectURL(nodeToDelete.fileUrl)
    }
    setNodes((prev) => prev.filter((node) => node.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  // Editar contenido del nodo
  const editNode = (nodeId: string, newContent: string): void => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, content: newContent } : node))
    )
  }

  // Actualizar nodo
  const updateNode = (nodeId: string, updates: Partial<BaseNode>): void => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
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
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggedNodeId ? { ...n, x: dropX, y: dropY, parent: undefined } : n
        )
      )
      // Also remove from any folder children arrays
      setNodes((prev) =>
        prev.map((n) =>
          n.children ? { ...n, children: n.children.filter((id) => id !== draggedNodeId) } : n
        )
      )
      return
    }
    // First, try to detect HTML content dropped as text (e.g., from browser selection or another page)
    try {
  const htmlData = e.dataTransfer.getData('text/html')
      const plainData = e.dataTransfer.getData('text/plain')
      const dropX = (e.clientX - viewport.x) / viewport.scale
      const dropY = (e.clientY - viewport.y) / viewport.scale

      if (htmlData) {
        const newNode: BaseNode = {
          id: generateId(),
          type: 'html',
          x: dropX - 200,
          y: dropY - 120,
          width: 640,
          height: 420,
          content: htmlData,
          title: 'HTML',
          view: 'window',
        }
        setNodes((prev) => [...prev, newNode])
        return
      }

      // If plain text looks like HTML, use it as well
      if (plainData && /<\/?[a-z][\s\S]*>/i.test(plainData)) {
        const newNode: BaseNode = {
          id: generateId(),
          type: 'html',
          x: dropX - 200,
          y: dropY - 120,
          width: 640,
          height: 420,
          content: plainData,
          title: 'HTML',
          view: 'window',
        }
        setNodes((prev) => [...prev, newNode])
        return
      }

      // Fallback to file drops (images/media/html files)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]

        // If it's an .html file, read as text and create html node
        if (file.name.toLowerCase().endsWith('.html') || file.type === 'text/html') {
          const reader = new FileReader()
          reader.onload = () => {
            const text = String(reader.result || '')
            const newNode: BaseNode = {
              id: generateId(),
              type: 'html',
              x: dropX - 200,
              y: dropY - 120,
              width: 800,
              height: 600,
              content: text,
              title: file.name,
              view: 'window',
            }
            setNodes((prev) => [...prev, newNode])
          }
          reader.readAsText(file)
          return
        }

        // Otherwise keep existing media behavior
        const newNode: BaseNode = {
          id: generateId(),
          type: 'media',
          x: dropX - 100,
          y: dropY - 75,
          width: 640,
          height: 420,
          content: file.name,
          title: trimName(file.name),
          file: file,
          fileUrl: URL.createObjectURL(file),
          view: 'window',
        }
        setNodes((prev) => [...prev, newNode])
      }
    } catch (err) {
      // ignore read errors
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

  // If we asked to start editing a node but it was compact and we toggled it to window,
  // wait for the node to be in 'window' view before activating edit mode.
  useEffect(() => {
    if (!pendingEditNode) return
    const node = nodes.find((n) => n.id === pendingEditNode)
    if (node && node.view === 'window') {
      setEditingNode(pendingEditNode)
      setPendingEditNode(null)
    }
  }, [nodes, pendingEditNode])

  const updateTitle = (nodeId: string, newTitle: string) => {
    updateNode(nodeId, { title: newTitle })
  }

  // Manejar inicio de drag (viewport o nodo)
  const handleMouseDown = (e: React.MouseEvent): void => {
    const target = e.target as HTMLElement

    // Si está presionada la barra espaciadora, mover viewport
    if (isSpacePressed && target === canvasRef.current) {
      setIsDraggingViewport(true)
      setDragStart({
        x: e.clientX - viewport.x,
        y: e.clientY - viewport.y,
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
        const node = nodes.find((n) => n.id === nodeId)
        if (node) {
          setResizeHandle(handleType)
          setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: node.width,
            height: node.height,
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
        const node = nodes.find((n) => n.id === nodeId)
        if (node) {
          setNodeDragStart({
            x: e.clientX,
            y: e.clientY,
            nodeX: node.x,
            nodeY: node.y,
          })
          setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, isDragging: true } : n)))
        }
      }
      return
    }

    // If clicked inside a node but not on header: select; if compact, start drag as before
    if (target.closest('[data-node-id]')) {
      const nodeElement = target.closest('[data-node-id]') as HTMLElement
      const nodeId = nodeElement.dataset.nodeId
      if (nodeId) {
        const node = nodes.find((n) => n.id === nodeId)
        setSelectedNode(nodeId)
        // compact nodes: dragging allowed from body
        if (node && node.view !== 'window' && node.view !== 'fullscreen') {
          setHeaderActive(null)
          setNodeDragStart({ x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y })
          setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, isDragging: true } : n)))
        } else {
          // window/fullscreen: header is required for drag
          setHeaderActive(null)
        }
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
        y: e.clientY - dragStart.y,
      })
      return
    }

    // Resize del nodo - CORREGIDO: aplicar transformación de viewport
    if (resizeHandle && selectedNode) {
      const deltaX = (e.clientX - resizeStart.x) / viewport.scale
      const deltaY = (e.clientY - resizeStart.y) / viewport.scale

      setNodes((prev) =>
        prev.map((node) => {
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
        })
      )
      return
    }

    // Mover nodo si está siendo arrastrado
    if (selectedNode && nodeDragStart.x !== 0) {
      const deltaX = e.clientX - nodeDragStart.x
      const deltaY = e.clientY - nodeDragStart.y

      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNode
            ? {
                ...node,
                x: nodeDragStart.nodeX + deltaX / viewport.scale,
                y: nodeDragStart.nodeY + deltaY / viewport.scale,
              }
            : node
        )
      )
    }
  }

  // Manejar fin de drag - CORREGIDO: cursor siempre se restaura a default
  const handleMouseUp = (): void => {
    setIsDraggingViewport(false)
    setResizeHandle(null)

    // Finalizar arrastre de nodo
    if (selectedNode) {
      setNodes((prev) =>
        prev.map((node) => (node.id === selectedNode ? { ...node, isDragging: false } : node))
      )
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
          const folderNode = nodes.find((n) => n.id === folderId)
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

    setViewport((prev) => ({
      ...prev,
      scale: newScale,
    }))
  }

  // Actualiza el renderizado de nodos
  // Compact nodes reserve space for a square thumbnail + title
  const COMPACT_SIZE = { width: 105, height: 105 }

  const toggleToWindow = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    if (node.view === 'compact' || !node.view) {
      // enlarge defaults when switching from compact to window
      const dims = getWindowSize(node.type)
      updateNode(nodeId, { view: 'window', width: dims.width, height: dims.height })
    } else if (node.view === 'window') {
      updateNode(nodeId, { view: 'fullscreen' })
    }
  }

  const setCompact = (nodeId: string) => updateNode(nodeId, { view: 'compact' })
  const setFullscreen = (nodeId: string) => updateNode(nodeId, { view: 'fullscreen' })
  const setWindow = (nodeId: string) => updateNode(nodeId, { view: 'window' })

  const renderNodes = (): JSX.Element[] => {
    // render only top-level nodes (no parent)
    const topNodes = nodes.filter((n) => !n.parent && n.view !== 'fullscreen')
    return topNodes.map((node) => {
      const isSelected = node.id === selectedNode

      const isCompact = node.view !== 'window' && node.view !== 'fullscreen'
      const wrapperWidth = isCompact ? COMPACT_SIZE.width : node.width
      const wrapperHeight = isCompact ? COMPACT_SIZE.height : node.height

      return (
        <div
          key={node.id}
          data-node-id={node.id}
          onPointerDown={() => setSelectedNode(node.id)}
          onDoubleClick={(e) => {
            // only expand compact nodes when double-clicking the body
            if (isCompact) {
              e.stopPropagation()
              toggleToWindow(node.id)
            }
          }}
          style={{
            position: 'absolute',
            left: `${node.x}px`,
            top: `${node.y}px`,
            width: `${wrapperWidth}px`,
            height: `${wrapperHeight}px`,
            userSelect: 'none',
          }}
        >
          {/* contenedor relativo: ahora actúa como la "ventana" cuando no es compact */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              ...(isCompact
                ? {}
                : {
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid rgba(15,23,42,0.06)',
                    boxShadow: '0 8px 22px rgba(15,23,42,0.04)',
                  }),
            }}
          >
            {/* Header: visible bar used as the only drag handle and to show filename (only for window mode) */}
            {!isCompact && (
              // header is visually part of the container now (no separate background/shadow)
              <div
                data-drag-handle
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  top: 12,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 10px',
                  background: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                  zIndex: 25,
                  cursor: 'grab',
                  userSelect: 'none',
                  borderBottom: '1px solid rgba(15,23,42,0.06)',
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  // If double-click happened on the title element, open title edit.
                  const target = e.target as HTMLElement
                  if (target.closest('[data-title]')) {
                    setTitleEdit({
                      id: node.id,
                      value: (node.title || node.content || '') as string,
                    })
                    return
                  }
                  // Otherwise, if in window view, enter fullscreen
                  if (node.view === 'window') {
                    setFullscreen(node.id)
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* subtle grip */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2,3px)',
                      gap: 2,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: '#CBD5E1',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: '#CBD5E1',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: '#CBD5E1',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: '#CBD5E1',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />
                  </div>
                  {/* title is separate from content */}
                  <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>
                    {titleEdit.id === node.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          autoFocus
                          value={titleEdit.value}
                          onChange={(e) => setTitleEdit({ id: node.id, value: e.target.value })}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 13,
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                          }}
                        />
                        <button
                          onClick={() => {
                            updateTitle(node.id, titleEdit.value)
                            setTitleEdit({ id: null, value: '' })
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="px-3 py-1 text-white"
                          style={{ background: '#F68C1E', borderRadius: 8, border: 'none' }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span data-title>{node.title || node.content}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCompact(node.id)
                      setSelectedNode(node.id)
                    }}
                    title="Minimizar"
                    className="p-2 rounded-sm hover:bg-gray-100"
                    aria-label="Minimizar"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 12h12"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFullscreen(node.id)
                      setSelectedNode(node.id)
                    }}
                    title="Maximizar"
                    className="p-2 rounded-sm hover:bg-gray-100"
                    aria-label="Maximizar"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: !isCompact ? 56 : 0,
                bottom: 0,
                overflow: 'hidden',
                padding: !isCompact ? 12 : 0,
              }}
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
                onToggleToWindow={toggleToWindow}
                externalEditing={editingNode === node.id}
                onEditingDone={() => setEditingNode(null)}
                allNodes={nodes}
                onAddToFolder={(childId: string, folderId: string) => {
                  updateNode(childId, { parent: folderId })
                  // also ensure folder children array
                  const folder = nodes.find((n) => n.id === folderId)
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
                    setNodes((prev) =>
                      prev.map((n) => {
                        if (n.id !== selectedNode) return n
                        let newWidth = resizeStart.width
                        let newHeight = resizeStart.height
                        let newX = n.x
                        let newY = n.y
                        switch (handle) {
                          case 'e':
                            newWidth = Math.max(50, resizeStart.width + deltaX)
                            break
                          case 'w':
                            newWidth = Math.max(50, resizeStart.width - deltaX)
                            newX = n.x + deltaX
                            break
                          case 's':
                            newHeight = Math.max(50, resizeStart.height + deltaY)
                            break
                          case 'n':
                            newHeight = Math.max(50, resizeStart.height - deltaY)
                            newY = n.y + deltaY
                            break
                          case 'se':
                            newWidth = Math.max(50, resizeStart.width + deltaX)
                            newHeight = Math.max(50, resizeStart.height + deltaY)
                            break
                          case 'sw':
                            newWidth = Math.max(50, resizeStart.width - deltaX)
                            newHeight = Math.max(50, resizeStart.height + deltaY)
                            newX = n.x + deltaX
                            break
                          case 'ne':
                            newWidth = Math.max(50, resizeStart.width + deltaX)
                            newHeight = Math.max(50, resizeStart.height - deltaY)
                            newY = n.y + deltaY
                            break
                          case 'nw':
                            newWidth = Math.max(50, resizeStart.width - deltaX)
                            newHeight = Math.max(50, resizeStart.height - deltaY)
                            newX = n.x + deltaX
                            newY = n.y + deltaY
                            break
                        }
                        return { ...n, width: newWidth, height: newHeight, x: newX, y: newY }
                      })
                    )
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
            transformOrigin: '0 0',
          }}
        >
          {renderNodes()}
        </div>

        {/* Floating toolbar for selected node (compact/window) */}
        {selectedNode &&
          (() => {
            const node = nodes.find((n) => n.id === selectedNode)
            if (!node) return null
            if (node.view === 'fullscreen') return null
            // compute screen position of node
            const screenX = (node.x + viewport.x) * viewport.scale
            const screenY = (node.y + viewport.y) * viewport.scale
            const left =
              screenX +
              (node.view === 'window' ? (node.width * viewport.scale) / 2 : COMPACT_SIZE.width / 2)
            // Move toolbar higher for window mode to avoid overlapping node header area
            const top = screenY - (node.view === 'window' ? 28 : 10)
            return (
              <div
                style={{
                  position: 'absolute',
                  left,
                  top,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 9999,
                  pointerEvents: 'auto',
                }}
              >
                <div
                  className="bg-gray-800 text-white rounded-md shadow-lg p-2 flex gap-3 items-center"
                  style={{ pointerEvents: 'auto' }}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNode(node.id)
                    }}
                    title="Eliminar"
                    className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                    aria-label="Eliminar"
                  >
                    <Trash size={14} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateNode(node.id)
                    }}
                    title="Duplicar"
                    className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center"
                    aria-label="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // if compact, expand to window first then enter edit mode for text nodes
                      if (node.view === 'compact') {
                        toggleToWindow(node.id)
                        // set pending so effect will activate editing once view becomes 'window'
                        setPendingEditNode(node.id)
                      } else {
                        setEditingNode(node.id)
                      }
                    }}
                    title="Editar"
                    className="p-2 rounded-md hover:bg-gray-700 text-white flex items-center justify-center"
                    aria-label="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  {/* header contains minimize/expand controls now; toolbar no longer duplicates them */}
                </div>
              </div>
            )
          })()}

        {/* Fullscreen overlay for nodes in fullscreen mode */}
        {nodes
          .filter((n) => n.view === 'fullscreen')
          .map((fsNode) => (
            <div
              key={fsNode.id}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '90vw',
                  height: '90vh',
                  background: 'white',
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 12px 0 12px',
                    borderBottom: '1px solid #eee',
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    const target = e.target as HTMLElement
                    if (target.closest('[data-title]')) {
                      setTitleEdit({
                        id: fsNode.id,
                        value: (fsNode.title || fsNode.content || '') as string,
                      })
                      return
                    }
                    // clicking elsewhere in fullscreen header does nothing special
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2,3px)',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          background: '#CBD5E1',
                          borderRadius: 2,
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          background: '#CBD5E1',
                          borderRadius: 2,
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          background: '#CBD5E1',
                          borderRadius: 2,
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          background: '#CBD5E1',
                          borderRadius: 2,
                          display: 'block',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {titleEdit.id === fsNode.id ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            autoFocus
                            value={titleEdit.value}
                            onChange={(e) => setTitleEdit({ id: fsNode.id, value: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            style={{
                              fontSize: 14,
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                            }}
                          />
                          <button
                            onClick={() => {
                              updateTitle(fsNode.id, titleEdit.value)
                              setTitleEdit({ id: null, value: '' })
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="px-3 py-1 text-white"
                            style={{ background: '#F68C1E', borderRadius: 8, border: 'none' }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span data-title>{fsNode.title || fsNode.content}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // If media node, open file selector to replace the media
                        if (fsNode.type === 'media') {
                          setSelectedNode(fsNode.id)
                          openFileSelector(fsNode.id)
                          return
                        }
                        setSelectedNode(fsNode.id)
                        setEditingNode(fsNode.id)
                      }}
                      title={fsNode.type === 'media' ? 'Reemplazar' : 'Editar'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {fsNode.type === 'media' ? <UploadCloud size={16} /> : <Edit size={16} />}
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setWindow(fsNode.id)}
                      title="Restaurar"
                      className="p-2 rounded-sm hover:bg-gray-100"
                      aria-label="Restaurar"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 12h12"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    {/* Close (X) button - minimize/close from fullscreen */}
                    <button
                      onClick={() => setCompact(fsNode.id)}
                      title="Cerrar"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 6,
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 56, bottom: 0 }}>
                  <NodeFactory
                    node={fsNode}
                    isSelected={selectedNode === fsNode.id}
                    viewport={viewport}
                    onSelect={setSelectedNode}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onDuplicate={duplicateNode}
                    onEdit={editNode}
                    onFileSelect={openFileSelector}
                    onToggleToWindow={toggleToWindow}
                    externalEditing={editingNode === fsNode.id}
                    onEditingDone={() => setEditingNode(null)}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default RisspoCanvas
