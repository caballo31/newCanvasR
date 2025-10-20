export interface BaseNode {
  id: string
  type: 'text' | 'media' | 'html' | 'folder'
  x: number
  y: number
  width: number
  height: number
  content?: string
  title?: string
  file?: File | null
  fileUrl?: string
  isSelected?: boolean
  isDragging?: boolean
  // Folder specific
  children?: string[]
  view?: 'compact' | 'window' | 'fullscreen'
  parent?: string | null
}

export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface NodeProps {
  node: BaseNode
  isSelected: boolean
  viewport: Viewport
  onSelect: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<BaseNode>) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onEdit: (nodeId: string, newContent: string) => void
  onFileSelect: (nodeId?: string) => void
}
