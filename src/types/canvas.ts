export type NodeType = 'text' | 'image' | 'html' | 'folder'
export type FolderView = 'compact' | 'window'

export interface BaseNode {
  id: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  name?: string
  minimized?: boolean
}

export interface TextNode extends BaseNode {
  type: 'text'
  content: string
}

export interface ImageNode extends BaseNode {
  type: 'image'
  src: string
  alt?: string
}

export interface HTMLNode extends BaseNode {
  type: 'html'
  content: string
}

export interface FolderNode extends BaseNode {
  type: 'folder'
  view: FolderView
  children: string[]
}

export type UINode = TextNode | ImageNode | HTMLNode | FolderNode

export interface CanvasState {
  nodes: Record<string, UINode>
  selectedNodes: string[]
  viewport: {
    x: number
    y: number
    scale: number
  }
}

export interface CanvasActions {
  // Node operations
  addNode: (node: UINode) => void
  updateNode: (id: string, updates: Partial<UINode>) => void
  removeNode: (id: string) => void
  setSelectedNodes: (ids: string[]) => void
  
  // Folder operations
  addToFolder: (nodeId: string, folderId: string) => void
  removeFromFolder: (nodeId: string, folderId: string) => void
  setFolderView: (folderId: string, view: FolderView) => void
  minimizeNode: (nodeId: string) => void
  
  // Viewport operations
  setViewport: (viewport: CanvasState['viewport']) => void
  
  // Persistence
  loadState: (state: CanvasState) => void
  clearState: () => void
}
