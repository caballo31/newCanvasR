import React, { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Type, FileImage, Code, Folder } from 'lucide-react'
import { BaseNode, Viewport } from './types/canvas'
import NodeFactory from './nodes/NodeFactory'
import ResizeHandles from './nodes/ResizeHandles'
import FloatingToolbar from './FloatingToolbar'
import FullscreenOverlay from './FullscreenOverlay'
import WindowHeader from './WindowHeader'
import { generateId } from '../../lib/utils'
import { viewportCenterOnCanvas, getWindowSize } from '../../lib/canvas-helpers'
import { GRID_SIZE, COMPACT_NODE_SIZE } from '../../lib/constants'
import { orderByZStack, getVisualSize, getZIndexFor } from '../../lib/zstack'
import { serializeState, deserializeState } from '../../lib/persistence'
import { toWorld, findDropTarget } from '../../lib/dndService'
import { canvasReducer, type CanvasModel, type CanvasAction } from '../../stores/canvasReducer'
import { duplicateNode as duplicateNodeState, updateNodeById, centerViewportOnContent } from '../../stores/canvasState'

const RisspoCanvas: React.FC = () => {
  // Local constants
  const GRID = GRID_SIZE
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastPointerSamples = useRef<Array<{ t: number; x: number; y: number }>>([])
  const flingAnimRef = useRef<number | null>(null)
  const pointerMap = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<null | {
    startDistance: number
    startCenterClient: { x: number; y: number }
    anchorWorld: { x: number; y: number }
    startScale: number
  }>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [nodes, setNodes] = useState<BaseNode[]>([])
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [isDraggingViewport, setIsDraggingViewport] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  // Multi-select: list of selected node ids (primary = last)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  // which node had its header clicked (shows resize handles / enables dragging)
  const [headerActive, setHeaderActive] = useState<string | null>(null)
  // marquee selection state
  const [isMarqueeActive, setIsMarqueeActive] = useState(false)
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null)
  const [marqueeRect, setMarqueeRect] = useState<
    | null
    | { x: number; y: number; w: number; h: number }
  >(null)
  // Group drag info when dragging multiple nodes
  const [groupDragStart, setGroupDragStart] = useState<
    | null
    | { startX: number; startY: number; items: Array<{ id: string; x: number; y: number }> }
  >(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [pendingEditNode, setPendingEditNode] = useState<string | null>(null)
  const [titleEdit, setTitleEdit] = useState<{ id: string | null; value: string }>({
    id: null,
    value: '',
  })
  // When selecting a file from disk, optionally target an existing node for replacement
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null)
  // Hover-open folder target when dragging
  const [hoverFolderId, setHoverFolderId] = useState<string | null>(null)
  const hoverTimerRef = useRef<number | null>(null)

  // Reducer dispatch helper: ensure sequential, atomic updates using functional setState
  const viewportRef = useRef(viewport)
  const selectedIdsRef = useRef(selectedIds)
  useEffect(() => { viewportRef.current = viewport }, [viewport])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  const getModel = (): CanvasModel => ({ nodes, viewport, selectedIds })
  const applyModel = (m: CanvasModel) => {
    setNodes(m.nodes)
    setViewport(m.viewport)
    setSelectedIds(m.selectedIds)
    setSelectedNode(m.selectedIds.length ? m.selectedIds[m.selectedIds.length - 1] : null)
  }
  const dispatchAction = (action: CanvasAction) => {
    setNodes((prevNodes) => {
      const prevModel: CanvasModel = {
        nodes: prevNodes,
        viewport: viewportRef.current,
        selectedIds: selectedIdsRef.current,
      }
      const next = canvasReducer(prevModel, action)
      // Update other slices derived from the reducer result
      if (next.viewport !== prevModel.viewport) setViewport(next.viewport)
      if (next.selectedIds !== prevModel.selectedIds) setSelectedIds(next.selectedIds)
      setSelectedNode(next.selectedIds.length ? next.selectedIds[next.selectedIds.length - 1] : null)
      return next.nodes
    })
  }

  // Helpers
  const trimName = (name: string): string => {
    const max = 24
    if (name.length <= max) return name
    const dot = name.lastIndexOf('.')
    if (dot > 0 && dot < name.length - 1) {
      const ext = name.slice(dot)
      const base = name.slice(0, max - 3 - ext.length)
      return `${base}...${ext}`
    }
    return name.slice(0, max - 3) + '...'
  }

  const setSingleSelection = (nodeId: string): void => {
    dispatchAction({ type: 'SELECT_ONE', id: nodeId })
  }

  const toggleSelection = (nodeId: string): void => {
    dispatchAction({ type: 'TOGGLE_SELECT', id: nodeId })
  }

  const bringToFront = (nodeId: string): void => {
    dispatchAction({ type: 'BRING_TO_FRONT', id: nodeId })
  }

  const duplicateNode = (nodeId: string): void => {
    // create deterministic id so we can select it right after
    const newId = generateId()
    setNodes((prev) => duplicateNodeState(prev, nodeId, () => newId))
    setSelectedIds([newId])
    setSelectedNode(newId)
    bringToFront(newId)
  }

  const openFileSelector = (nodeId?: string): void => {
    setReplaceTargetId(nodeId || null)
    fileInputRef.current?.click()
  }
  // File input handler (replace target or create new media node)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    const url = URL.createObjectURL(file)
    if (replaceTargetId) {
      // cleanup old url if present
      const existing = nodes.find((n) => n.id === replaceTargetId)
      if (existing?.fileUrl && existing.fileUrl !== url) {
        try { URL.revokeObjectURL(existing.fileUrl) } catch {}
      }
      dispatchAction({
        type: 'UPDATE_NODE',
        id: replaceTargetId,
        patch: {
          type: 'media',
          content: file.name,
          title: trimName(file.name),
          file,
          fileUrl: url,
          view: 'window',
        },
      })
      dispatchAction({ type: 'SELECT_ONE', id: replaceTargetId })
      setSelectedNode(replaceTargetId)
      setReplaceTargetId(null)
    } else {
      // create a new media node at viewport center, snapped to grid
      const dims = getWindowSize('media')
      const center = viewportCenterOnCanvas(viewport, window.innerWidth, window.innerHeight)
      const xTL = Math.round((center.x - dims.width / 2) / GRID) * GRID
      const yTL = Math.round((center.y - dims.height / 2) / GRID) * GRID
      const id = generateId()
      // Pass center position to reducer (it will subtract half-size)
      dispatchAction({ type: 'CREATE_NODE', nodeType: 'media', at: { x: xTL + dims.width / 2, y: yTL + dims.height / 2 }, openInWindow: true, id })
      dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: file.name, title: trimName(file.name), file, fileUrl: url } })
      bringToFront(id)
    }
    // reset input so same file can be chosen again later
    e.currentTarget.value = ''
  }

  const createNode = (type: BaseNode['type']): void => {
    try { console.debug('[RisspoCanvas] createNode', type) } catch {}
    const dims = getWindowSize(type)
    const center = viewportCenterOnCanvas(viewport, window.innerWidth, window.innerHeight)
    const id = generateId()
    const xTL = Math.round((center.x - dims.width / 2) / GRID) * GRID
    const yTL = Math.round((center.y - dims.height / 2) / GRID) * GRID
    dispatchAction({ type: 'CREATE_NODE', nodeType: type, at: { x: xTL + dims.width / 2, y: yTL + dims.height / 2 }, openInWindow: true, id })
    // Custom content defaults matching previous behavior
    if (type === 'text') {
      dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: 'New text' } })
    }
    if (type === 'html') {
      dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: '<p>New HTML</p>', title: 'HTML' } })
    }
    bringToFront(id)
  }
  const deleteNode = (nodeId: string): void => {
    // Reuse existing per-node deletion behavior to preserve URL revocation
    const nodeToDelete = nodes.find((n) => n.id === nodeId)
    if (nodeToDelete?.fileUrl) {
      try { URL.revokeObjectURL(nodeToDelete.fileUrl) } catch {}
    }
    const model = getModel()
    const next = { ...model, nodes: model.nodes.filter((n) => n.id !== nodeId) }
    applyModel({ ...next, selectedIds: next.selectedIds.filter((id) => id !== nodeId) })
  }

  // Editar contenido del nodo
  const editNode = (nodeId: string, newContent: string): void => {
    dispatchAction({ type: 'UPDATE_NODE', id: nodeId, patch: { content: newContent } })
  }

  // Actualizar nodo
  const updateNode = (nodeId: string, updates: Partial<BaseNode>): void => {
    dispatchAction({ type: 'UPDATE_NODE', id: nodeId, patch: updates })
  }

  // Drag & drop de archivos
  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    try { console.debug('[RisspoCanvas] handleDrop') } catch {}
    const draggedNodeId = e.dataTransfer.getData('text/node-id')
    if (draggedNodeId) {
      // Move existing node to this drop position and remove parent
      let dropX = (e.clientX - viewport.x) / viewport.scale
      let dropY = (e.clientY - viewport.y) / viewport.scale
      if (!isAltPressed) {
        dropX = Math.round(dropX / GRID) * GRID
        dropY = Math.round(dropY / GRID) * GRID
      }
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
      let dropX = (e.clientX - viewport.x) / viewport.scale
      let dropY = (e.clientY - viewport.y) / viewport.scale
      if (!isAltPressed) {
        dropX = Math.round(dropX / GRID) * GRID
        dropY = Math.round(dropY / GRID) * GRID
      }

      if (htmlData) {
        const width = 640, height = 420
        const id = generateId()
        const at = { x: (dropX - 200) + width / 2, y: (dropY - 120) + height / 2 }
        dispatchAction({ type: 'CREATE_NODE', nodeType: 'html', at, openInWindow: true, id })
        dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: htmlData, title: 'HTML' } })
        bringToFront(id)
        return
      }

      // If plain text looks like HTML, use it as well
      if (plainData && /<\/?[a-z][\s\S]*>/i.test(plainData)) {
        const width = 640, height = 420
        const id = generateId()
        const at = { x: (dropX - 200) + width / 2, y: (dropY - 120) + height / 2 }
        dispatchAction({ type: 'CREATE_NODE', nodeType: 'html', at, openInWindow: true, id })
        dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: plainData, title: 'HTML' } })
        bringToFront(id)
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
            const width = 800, height = 600
            const id = generateId()
            const at = { x: (dropX - 200) + width / 2, y: (dropY - 120) + height / 2 }
            dispatchAction({ type: 'CREATE_NODE', nodeType: 'html', at, openInWindow: true, id })
            dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: text, title: file.name } })
            bringToFront(id)
          }
          reader.readAsText(file)
          return
        }

        // Otherwise keep existing media behavior
        const width = 640, height = 420
        const id = generateId()
        const at = { x: (dropX - 100) + width / 2, y: (dropY - 75) + height / 2 }
        const fileUrl = URL.createObjectURL(file)
        dispatchAction({ type: 'CREATE_NODE', nodeType: 'media', at, openInWindow: true, id })
        dispatchAction({ type: 'UPDATE_NODE', id, patch: { content: file.name, title: trimName(file.name), file, fileUrl } })
        bringToFront(id)
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

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault()
          selectedIds.forEach((id) => deleteNode(id))
        } else if (selectedNode) {
          e.preventDefault()
          deleteNode(selectedNode)
        }
      }

      // Duplicate selected (Ctrl/Cmd + D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedIds.length > 1) {
          dispatchAction({ type: 'SET_SELECTED', ids: selectedIds })
          dispatchAction({ type: 'DUPLICATE_SELECTED' })
        } else if (selectedNode) {
          duplicateNode(selectedNode)
        }
      }

      // Deselect all with Escape
      if (e.key === 'Escape') {
        dispatchAction({ type: 'SELECT_ONE', id: null })
      }

      // Track Alt state for snap override
      if (e.key === 'Alt') setIsAltPressed(true)
      // Start pan with Space
      if (e.code === 'Space') {
        setIsSpacePressed(true)
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
      }

      // Zoom presets
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        const preset = e.key
        const scale = preset === '1' ? 1 : preset === '2' ? 0.5 : 2
        setViewport((prev) => ({ ...prev, scale }))
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

      if (e.key === 'Alt') setIsAltPressed(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    const handlePointerUp = (): void => {
      // If we were panning, compute fling from recent pointer samples
      if (isDraggingViewport) {
        const samples = lastPointerSamples.current
        if (samples.length >= 2) {
          const first = samples[0]
          const last = samples[samples.length - 1]
          const dt = (last.t - first.t) || 16
          const vx = (last.x - first.x) / dt
          const vy = (last.y - first.y) / dt
          let velX = vx * 1000
          let velY = vy * 1000
          const decay = 0.95
          const step = () => {
            velX *= decay
            velY *= decay
            if (Math.abs(velX) < 0.5 && Math.abs(velY) < 0.5) {
              if (flingAnimRef.current) { window.cancelAnimationFrame(flingAnimRef.current); flingAnimRef.current = null }
              return
            }
            setViewport((prev) => ({ ...prev, x: prev.x + velX * 0.016, y: prev.y + velY * 0.016 }))
            flingAnimRef.current = window.requestAnimationFrame(step)
          }
          flingAnimRef.current = window.requestAnimationFrame(step)
        }
        lastPointerSamples.current = []
      }
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
  }, [selectedNode, selectedIds])

  // Advanced wheel handler is attached inline on canvas div as handleWheelExternal

  // Double click empty to reset zoom/center
  const handleDoubleClick = (e: React.MouseEvent): void => {
    // Only reset when double-click on empty canvas (not on node)
    if ((e.target as HTMLElement).closest('[data-node-id]')) return
    // reset scale to 1, keep center at cursor
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    // animate to scale=1 and center to 0,0
    setViewport((prev) => ({ ...prev, scale: 1, x: 0, y: 0 }))
  }

  // (fling handled in effect's pointerup handler)

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

    // Si está presionada la barra espaciadora, siempre mover viewport (override de selección)
    if (isSpacePressed) {
      e.preventDefault()
      setIsDraggingViewport(true)
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
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
          setSingleSelection(nodeId)
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
        // If modifier key (Shift/Ctrl/Cmd/Alt) is pressed, toggle selection instead of starting a drag
        if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
          toggleSelection(nodeId)
          return
        }
        const isMulti = selectedIds.includes(nodeId) && selectedIds.length > 1
        if (!isMulti) {
          setSingleSelection(nodeId)
        } else {
          // keep selectedIds as-is and set primary
          setSelectedNode(nodeId)
        }
        setHeaderActive(nodeId)
        const node = nodes.find((n) => n.id === nodeId)
        if (node) {
          // If we clicked any node that is part of a multi-selection, start a group drag
          if (selectedIds.length > 1 && selectedIds.includes(nodeId)) {
            const items = selectedIds
              .map((id) => {
                const n = nodes.find((nn) => nn.id === id)
                return n ? { id, x: n.x, y: n.y } : null
              })
              .filter((x): x is { id: string; x: number; y: number } => !!x)
            setGroupDragStart({ startX: e.clientX, startY: e.clientY, items })
            setNodes((prev) => prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isDragging: true } : n)))
          } else {
            setNodeDragStart({ x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y })
            setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, isDragging: true } : n)))
          }
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
        if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
          // Toggle selection and stop — don't start dragging here because
          // selectedIds hasn't updated synchronously and subsequent logic
          // may incorrectly start a single-node drag.
          toggleSelection(nodeId)
          return
        } else {
          // If this node is part of a multi-selection, start group drag; otherwise single select
          if (selectedIds.length > 1 && selectedIds.includes(nodeId)) {
            bringToFront(nodeId)
            const items = selectedIds
              .map((id) => {
                const n = nodes.find((nn) => nn.id === id)
                return n ? { id, x: n.x, y: n.y } : null
              })
              .filter((x): x is { id: string; x: number; y: number } => !!x)
            setGroupDragStart({ startX: e.clientX, startY: e.clientY, items })
            setNodes((prev) => prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isDragging: true } : n)))
          } else {
            setSingleSelection(nodeId)
            bringToFront(nodeId)
          }
        }
        // compact nodes: dragging allowed from body
        if (node && node.view !== 'window' && node.view !== 'fullscreen') {
          setHeaderActive(null)
          // If we already started a group drag above, nodes are already flagged; otherwise start single drag
          if (!(groupDragStart && groupDragStart.items.length > 0) && node) {
            setNodeDragStart({ x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y })
            setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, isDragging: true } : n)))
          }
        } else {
          // window/fullscreen: header is required for drag
          setHeaderActive(null)
        }
      }
      return
    }

    // Click on empty canvas: start marquee selection
    const canvasPos = {
      x: (e.clientX - viewport.x) / viewport.scale,
      y: (e.clientY - viewport.y) / viewport.scale,
    }
    setIsMarqueeActive(true)
    setMarqueeStart(canvasPos)
    setMarqueeRect({ x: canvasPos.x, y: canvasPos.y, w: 0, h: 0 })
    setSelectedNode(null)
    setSelectedIds([])
    setHeaderActive(null)
  }

  // Manejar movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent): void => {
    setPointerPos({ x: e.clientX, y: e.clientY })
    // Mover viewport si está en modo arrastre de viewport
    if (isDraggingViewport) {
      const next = { ...viewport, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
      setViewport(next)
      // track pointer samples for fling
      const now = Date.now()
      lastPointerSamples.current.push({ t: now, x: e.clientX, y: e.clientY })
      // keep only last 100ms of samples
      lastPointerSamples.current = lastPointerSamples.current.filter(s => now - s.t <= 120)
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

    // Marquee update
    if (isMarqueeActive && marqueeStart) {
      const curr = {
        x: (e.clientX - viewport.x) / viewport.scale,
        y: (e.clientY - viewport.y) / viewport.scale,
      }
      const x = Math.min(marqueeStart.x, curr.x)
      const y = Math.min(marqueeStart.y, curr.y)
      const w = Math.abs(curr.x - marqueeStart.x)
      const h = Math.abs(curr.y - marqueeStart.y)
      setMarqueeRect({ x, y, w, h })
      return
    }

    // Mover grupo si está siendo arrastrado
    if (groupDragStart) {
      const deltaX = (e.clientX - groupDragStart.startX) / viewport.scale
      const deltaY = (e.clientY - groupDragStart.startY) / viewport.scale
      const itemsMap = new Map(groupDragStart.items.map((i) => [i.id, i]))
      setNodes((prev) =>
        prev.map((node) => {
          if (!selectedIds.includes(node.id)) return node
          const base = itemsMap.get(node.id)
          if (!base) return node
          return { ...node, x: base.x + deltaX, y: base.y + deltaY }
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

    // While dragging, compute hover drop target (folders) for feedback + hover-open
    const isDraggingNode = (selectedNode && nodeDragStart.x !== 0) || !!groupDragStart
    if (isDraggingNode) {
      const world = toWorld({ x: e.clientX, y: e.clientY }, viewport)
      const target = findDropTarget(nodes, world)
      const nextHover = target.folderId || null
      if (hoverFolderId !== nextHover) {
        setHoverFolderId(nextHover)
        // reset pending hover-open timer
        if (hoverTimerRef.current) {
          window.clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        if (nextHover) {
          hoverTimerRef.current = window.setTimeout(() => {
            setNodes((prev) => {
              const folder = prev.find((n) => n.id === nextHover)
              if (!folder) return prev
              if (folder.view === 'window') return prev
              const dims = getWindowSize('folder')
              return updateNodeById(prev, folder.id, {
                view: 'window',
                width: dims.width,
                height: dims.height,
              })
            })
            bringToFront(nextHover)
          }, 500)
        }
      }
    }

    }

    // Pointer gesture handlers: support two-finger pan and pinch-to-zoom.
    const handlePointerDown = (e: React.PointerEvent) => {
      // register pointer
      pointerMap.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {}
      if (pointerMap.current.size === 2) {
        const pts = Array.from(pointerMap.current.values())
        const a = pts[0], b = pts[1]
        const startDistance = Math.hypot(b.x - a.x, b.y - a.y)
        const startCenterClient = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const anchorWorld = { x: (startCenterClient.x - viewport.x) / viewport.scale, y: (startCenterClient.y - viewport.y) / viewport.scale }
        pinchRef.current = { startDistance, startCenterClient, anchorWorld, startScale: viewport.scale }
        setIsDraggingViewport(true)
        lastPointerSamples.current = []
      }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
      // update pointer map
      if (pointerMap.current.has(e.pointerId)) {
        pointerMap.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      if (pointerMap.current.size >= 2 && pinchRef.current) {
        // gesture in progress
        const pts = Array.from(pointerMap.current.values())
        const a = pts[0], b = pts[1]
        const newCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const newDistance = Math.hypot(b.x - a.x, b.y - a.y)
        const { startDistance, anchorWorld, startScale } = pinchRef.current
        const ratio = newDistance / (startDistance || 1)
        const nextScale = Math.min(Math.max(0.1, startScale * ratio), 8)
        // compute new viewport so that anchorWorld stays under newCenter
        const newX = newCenter.x - anchorWorld.x * nextScale
        const newY = newCenter.y - anchorWorld.y * nextScale
        setViewport({ x: newX, y: newY, scale: nextScale })
        // record samples for fling (use center as pointer)
        const now = Date.now()
        lastPointerSamples.current.push({ t: now, x: newCenter.x, y: newCenter.y })
        lastPointerSamples.current = lastPointerSamples.current.filter(s => now - s.t <= 120)
        return
      }
      // not a multi-pointer gesture: forward to mouse handler for normal behavior
      handleMouseMove(e as unknown as React.MouseEvent)
    }

    const handlePointerUpGesture = (e: React.PointerEvent) => {
      // remove pointer
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
      pointerMap.current.delete(e.pointerId)
      if (pointerMap.current.size < 2) {
        pinchRef.current = null
        // will be handled by existing pointerup behavior (handleMouseUp)
        setIsDraggingViewport(false)
      }
    }

    

  // Manejar fin de drag - CORREGIDO: cursor siempre se restaura a default
  const handleMouseUp = (): void => {
    setIsDraggingViewport(false)
    setResizeHandle(null)
    // clear hover-open timer and highlight
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoverFolderId(null)

    // Finalizar arrastre de nodo
    if (selectedNode || groupDragStart) {
      setNodes((prev) =>
        prev.map((node) =>
          selectedIds.includes(node.id)
            ? { ...node, isDragging: false }
            : node.id === selectedNode
              ? { ...node, isDragging: false }
              : node
        )
      )
    }

    // If we just moved or resized una selección, aplicar snap-to-grid via reducer (salvo Alt)
    if (!isAltPressed) {
      if (groupDragStart && selectedIds.length > 0) {
        dispatchAction({ type: 'SNAP_SELECTED', grid: GRID })
      } else if (selectedNode) {
        dispatchAction({ type: 'SET_SELECTED', ids: [selectedNode] })
        dispatchAction({ type: 'SNAP_SELECTED', grid: GRID })
      }
    }

    setNodeDragStart({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
    setGroupDragStart(null)

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }

    // Finish marquee selection
    if (isMarqueeActive && marqueeRect) {
      const topNodes = nodes.filter((n) => !n.parent && n.view !== 'fullscreen')
      const hit = topNodes.filter((n) => {
        const sz = getVisualSize(n)
        const w = sz.width
        const h = sz.height
        const nx1 = n.x
        const ny1 = n.y
        const nx2 = n.x + w
        const ny2 = n.y + h
        const mx1 = marqueeRect.x
        const my1 = marqueeRect.y
        const mx2 = marqueeRect.x + marqueeRect.w
        const my2 = marqueeRect.y + marqueeRect.h
        return nx1 < mx2 && nx2 > mx1 && ny1 < my2 && ny2 > my1
      })
      const ids = hit.map((n) => n.id)
      dispatchAction({ type: 'SET_SELECTED', ids })
    }
    setIsMarqueeActive(false)
    setMarqueeStart(null)
    setMarqueeRect(null)

    // Detect drop into folder using world-space hit-testing (no DOM queries)
    if (selectedNode) {
      const world = toWorld(pointerPos, viewport)
      const target = findDropTarget(nodes, world)
      const folderId = target.folderId
      if (folderId && folderId !== selectedNode) {
        dispatchAction({ type: 'ADD_TO_FOLDER', childId: selectedNode, folderId })
      }
    }
  }

  // Wheel handling implemented inline on canvas div (Ctrl+wheel to zoom centered, otherwise vertical pan)

  // Actualiza el renderizado de nodos
  // Compact nodes reserve space for a square thumbnail + title
  const COMPACT_SIZE = COMPACT_NODE_SIZE

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

    // bring to front when changing view
    bringToFront(nodeId)
  }

  const setCompact = (nodeId: string) => updateNode(nodeId, { view: 'compact' })
  const setFullscreen = (nodeId: string) => updateNode(nodeId, { view: 'fullscreen' })
  const setWindow = (nodeId: string) => updateNode(nodeId, { view: 'window' })

  const renderNodes = (): JSX.Element[] => {
    // render only top-level nodes (no parent) ordered by visual bands
    const topNodes = orderByZStack(nodes.filter((n) => !n.parent && n.view !== 'fullscreen'))
    return topNodes.map((node) => {
      const isSelected = selectedIds.includes(node.id)

      const isCompact = node.view !== 'window' && node.view !== 'fullscreen'
      const wrapperWidth = isCompact ? COMPACT_SIZE.width : node.width
      const wrapperHeight = isCompact ? COMPACT_SIZE.height : node.height

      return (
        <div
          key={node.id}
          data-node-id={node.id}
          onPointerDown={undefined}
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
            zIndex: getZIndexFor(node) + (node.isDragging ? 2 : isSelected ? 1 : 0),
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
              // outline for multi-selection
              ...(isSelected ? { boxShadow: '0 0 0 4px rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.6)' } : {}),
              // hover drop-target highlight
              ...(hoverFolderId === node.id
                ? { boxShadow: '0 0 0 3px rgba(59,130,246,0.6), 0 8px 22px rgba(15,23,42,0.04)' }
                : {}),
            }}
          >
            {!isCompact && (
              <WindowHeader
                node={node}
                titleEdit={titleEdit}
                setTitleEdit={setTitleEdit}
                onMinimize={(id) => {
                  setCompact(id)
                  setSelectedNode(id)
                }}
                onMaximize={(id) => {
                  setFullscreen(id)
                  setSelectedNode(id)
                }}
                onEnterFullscreen={(id) => setFullscreen(id)}
              />
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
                onSelect={setSingleSelection}
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
                  dispatchAction({ type: 'ADD_TO_FOLDER', childId, folderId })
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
    <div
      className="w-full h-full bg-gray-50 relative overflow-hidden"
      onDragOver={(e) => {
        // Only handle global drag-over when not over the inner canvas element
        const target = e.target as HTMLElement
        if (canvasRef.current && canvasRef.current.contains(target)) return
        e.preventDefault()
      }}
      onDrop={(e) => {
        // Only route drops that happen outside the inner canvas (e.g., over the toolbar)
        const target = e.target as HTMLElement
        if (canvasRef.current && canvasRef.current.contains(target)) return
        handleDrop(e)
      }}
    >
      {/* Input oculto para archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*"
        className="hidden"
      />
      {/* Input oculto para importar estado */}
      <input
        type="file"
        ref={(el) => ((importRef as any).current = el)}
        onChange={(e) => {
          const files = e.target.files
          if (!files || files.length === 0) return
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const loaded = deserializeState(String(reader.result || '{}'))
              if (loaded) {
                setNodes(loaded.nodes)
                setViewport(loaded.viewport)
              }
            } catch {}
          }
          reader.readAsText(files[0])
          e.currentTarget.value = ''
        }}
        accept="application/json"
        className="hidden"
      />

      {/* Toolbar minimalista */}
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm border border-gray-200 p-2" style={{ zIndex: 10000 }}>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); createNode('text') }}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); openFileSelector() }}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <FileImage className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); createNode('html') }}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); createNode('folder') }}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Folder className="w-4 h-4" />
          </Button>
          {/* Center view */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewport((prev) =>
                centerViewportOnContent(prev, nodes, window.innerWidth, window.innerHeight)
              )
            }}
            className="flex items-center gap-2 hover:bg-gray-100"
            title="Centrar vista"
          >
            <span className="text-xs">Center</span>
          </Button>
          {/* Export state */
          }
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const data = serializeState(nodes, viewport)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'risspo-canvas-state.json'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 hover:bg-gray-100"
            title="Exportar estado"
          >
            <span className="text-xs">Export</span>
          </Button>
          {/* Import state */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              (importRef as any).current?.click()
            }}
            className="flex items-center gap-2 hover:bg-gray-100"
            title="Importar estado"
          >
            <span className="text-xs">Import</span>
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
        onDoubleClick={handleDoubleClick}
        onPointerMove={(e) => {
          // multi-touch and pointer gestures
          handlePointerMove(e)
          // forward pointer moves to mouse handler for single pointer cases
          handleMouseMove(e as unknown as React.MouseEvent)
        }}
        onPointerDown={(e) => handlePointerDown(e)}
        onPointerUp={(e) => { handlePointerUpGesture(e); handleMouseUp() }}
        onWheel={(e) => {
          // Advanced wheel handler: Ctrl/Cmd+wheel -> zoom centered on cursor; otherwise pan vertically
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            const prevScale = viewport.scale
            const delta = -e.deltaY * 0.0015
            const nextScale = Math.min(Math.max(0.1, prevScale + delta), 8)
            const worldX = (e.clientX - viewport.x) / prevScale
            const worldY = (e.clientY - viewport.y) / prevScale
            const newX = e.clientX - worldX * nextScale
            const newY = e.clientY - worldY * nextScale
            setViewport({ ...viewport, scale: nextScale, x: newX, y: newY })
          } else {
            e.preventDefault()
            setViewport((prev) => ({ ...prev, y: prev.y - e.deltaY }))
          }
        }}
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
          {/* DnD ghost for dragging nodes/groups */}
          {(((selectedNode && nodeDragStart.x !== 0) || groupDragStart) && (selectedIds.length > 0 || selectedNode)) && (() => {
            const selIds = selectedIds.length > 0 ? selectedIds : (selectedNode ? [selectedNode] : [])
            const dragNodes = nodes.filter(n => selIds.includes(n.id))
            if (dragNodes.length === 0) return null
            const xs = dragNodes.map(n => n.x)
            const ys = dragNodes.map(n => n.y)
            const x2s = dragNodes.map(n => n.x + getVisualSize(n).width)
            const y2s = dragNodes.map(n => n.y + getVisualSize(n).height)
            const left = Math.min(...xs)
            const top = Math.min(...ys)
            const right = Math.max(...x2s)
            const bottom = Math.max(...y2s)
            const w = right - left
            const h = bottom - top
            return (
              <div
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: w,
                  height: h,
                  border: '1px dashed rgba(59,130,246,0.8)',
                  background: 'rgba(59,130,246,0.08)',
                  borderRadius: 6,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                }}
              />
            )
          })()}
          {isMarqueeActive && marqueeRect && (
            <div
              style={{
                position: 'absolute',
                left: marqueeRect.x,
                top: marqueeRect.y,
                width: marqueeRect.w,
                height: marqueeRect.h,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.6)',
                borderRadius: 3,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <FloatingToolbar
          nodes={nodes}
          viewport={viewport}
          selectedIds={selectedIds}
          selectedNode={selectedNode}
          onDelete={(ids) => ids.forEach((id) => deleteNode(id))}
          onDuplicate={(ids) => {
            if (ids.length > 1) {
              // use reducer for multi-dup
              dispatchAction({ type: 'SET_SELECTED', ids })
              dispatchAction({ type: 'DUPLICATE_SELECTED' })
            } else if (ids.length === 1) {
              duplicateNode(ids[0])
            }
          }}
          onEdit={(anchorId) => {
            const anchorNode = nodes.find((n) => n.id === anchorId)
            if (!anchorNode) return
            if (anchorNode.view === 'compact') {
              toggleToWindow(anchorId)
              setPendingEditNode(anchorId)
            } else {
              setEditingNode(anchorId)
            }
          }}
        />

        {/* Fullscreen overlay for nodes in fullscreen mode */}
        {nodes
          .filter((n) => n.view === 'fullscreen')
          .map((fsNode) => (
            <FullscreenOverlay
              key={fsNode.id}
              node={fsNode}
              isSelected={selectedIds.includes(fsNode.id)}
              viewport={viewport}
              titleEdit={titleEdit}
              setTitleEdit={(v) => setTitleEdit(v)}
              onSaveTitle={(id, newTitle) => {
                updateTitle(id, newTitle)
                setTitleEdit({ id: null, value: '' })
              }}
              onRequestEdit={(_id) => {
                if (fsNode.type === 'media') {
                  setSelectedNode(fsNode.id)
                  openFileSelector(fsNode.id)
                } else {
                  setSelectedNode(fsNode.id)
                  setEditingNode(fsNode.id)
                }
              }}
              onRestore={(id) => setWindow(id)}
              onClose={(id) => setCompact(id)}
              onSelect={setSingleSelection}
              onUpdate={updateNode}
              onDelete={deleteNode}
              onDuplicate={duplicateNode}
              onEdit={editNode}
              onFileSelect={openFileSelector}
              onToggleToWindow={toggleToWindow}
              externalEditing={editingNode === fsNode.id}
              onEditingDone={() => setEditingNode(null)}
            />
          ))}
      </div>
    </div>
  )
}

export default RisspoCanvas
