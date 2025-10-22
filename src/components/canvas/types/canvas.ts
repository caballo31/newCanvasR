export interface BaseNode {
  id: string
  type: 'text' | 'media' | 'html' | 'folder'
  x: number
  y: number
  width: number
  height: number
  content?: string
  title?: string
  // optional tags for AI-generated summaries or user metadata
  tags?: string[]
  file?: File | null
  fileUrl?: string
  isSelected?: boolean
  isDragging?: boolean
  // z-band properties for layered stacking
  band?: 'A' | 'B' | 'C' | 'D' | 'E'
  z?: number
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
  // optional external editing flag: when true the node should open its internal editor
  externalEditing?: boolean
  // callback when editing finishes (used by NodeFactory / canvas)
  onEditingDone?: () => void
}
