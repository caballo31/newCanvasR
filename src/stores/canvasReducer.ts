import type { BaseNode, Viewport } from '../components/canvas/types/canvas'
import { generateId } from '../lib/utils'
import {
  updateNodeById,
  bringToFront as bringToFrontState,
  duplicateNode as duplicateNodeState,
  addChildToFolder,
  snapSelectionToGrid,
} from './canvasState'
import { getDefaultSize, getWindowSize } from '../lib/canvas-helpers'

export interface CanvasModel {
  nodes: BaseNode[]
  viewport: Viewport
  selectedIds: string[]
}

export type CanvasAction =
  | { type: 'SET_SELECTED'; ids: string[] }
  | { type: 'SELECT_ONE'; id: string | null }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'DELETE_SELECTED' }
  | { type: 'DUPLICATE_SELECTED' }
  | { type: 'CREATE_NODE'; nodeType: BaseNode['type']; at: { x: number; y: number }; openInWindow?: boolean; id?: string }
  | { type: 'UPDATE_NODE'; id: string; patch: Partial<BaseNode> }
  | { type: 'BRING_TO_FRONT'; id: string }
  | { type: 'ADD_TO_FOLDER'; childId: string; folderId: string }
  | { type: 'SNAP_SELECTED'; grid?: number }

export function canvasReducer(state: CanvasModel, action: CanvasAction): CanvasModel {
  switch (action.type) {
    case 'SET_SELECTED': {
      return { ...state, selectedIds: [...action.ids] }
    }
    case 'SELECT_ONE': {
      const id = action.id
      return { ...state, selectedIds: id ? [id] : [] }
    }
    case 'TOGGLE_SELECT': {
      const id = action.id
      const exists = state.selectedIds.includes(id)
      const selectedIds = exists
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id]
      return { ...state, selectedIds }
    }
    case 'DELETE_SELECTED': {
      if (state.selectedIds.length === 0) return state
      const toDelete = new Set(state.selectedIds)
      const nodes = state.nodes.filter((n) => !toDelete.has(n.id))
      return { ...state, nodes, selectedIds: [] }
    }
    case 'DUPLICATE_SELECTED': {
      if (state.selectedIds.length === 0) return state
      let nodes = state.nodes
      for (const id of state.selectedIds) {
        nodes = duplicateNodeState(nodes, id, generateId)
      }
      return { ...state, nodes }
    }
    case 'CREATE_NODE': {
      const newId = action.id ?? generateId()
      const size = action.openInWindow ? getWindowSize(action.nodeType) : getDefaultSize(action.nodeType)
      const newNode: BaseNode = {
        id: newId,
        type: action.nodeType,
        x: action.at.x - size.width / 2,
        y: action.at.y - size.height / 2,
        width: size.width,
        height: size.height,
        content: action.nodeType === 'text' ? 'Texto' : action.nodeType === 'html' ? 'HTML' : action.nodeType === 'folder' ? 'Carpeta' : 'Media',
        title: action.nodeType === 'text' ? 'Texto' : action.nodeType === 'html' ? 'HTML' : action.nodeType === 'folder' ? 'Carpeta' : 'Media',
        file: null,
        view: action.openInWindow ? 'window' : 'compact',
        ...(action.nodeType === 'folder' ? { children: [] as string[] } : {}),
      }
  // Do not auto-select newly created nodes — keep current selection as-is.
  return { ...state, nodes: [...state.nodes, newNode] }
    }
    case 'UPDATE_NODE': {
      return { ...state, nodes: updateNodeById(state.nodes, action.id, action.patch) }
    }
    case 'BRING_TO_FRONT': {
      return { ...state, nodes: bringToFrontState(state.nodes, action.id) }
    }
    case 'ADD_TO_FOLDER': {
      return { ...state, nodes: addChildToFolder(state.nodes, action.childId, action.folderId) }
    }
    case 'SNAP_SELECTED': {
      return {
        ...state,
        nodes: snapSelectionToGrid(state.nodes, state.selectedIds, action.grid),
      }
    }
  }
}
