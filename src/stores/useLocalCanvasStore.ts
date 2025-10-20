import { create } from 'zustand'
import type { BaseNode, Viewport } from '../components/canvas/types/canvas'
import { generateId } from '../lib/utils'

type State = {
  nodes: BaseNode[]
  viewport: Viewport
}

type Actions = {
  setNodes: (nodes: BaseNode[]) => void
  addNode: (node: BaseNode) => void
  updateNode: (id: string, updates: Partial<BaseNode>) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  setViewport: (viewport: Viewport) => void
}

const initialState: State = {
  nodes: [],
  viewport: { x: 0, y: 0, scale: 1 },
}

export const useLocalCanvasStore = create<State & Actions>((set) => ({
  ...initialState,

  setNodes: (nodes) => set({ nodes }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
    })),

  duplicateNode: (id) =>
    set((state) => {
      const src = state.nodes.find((n) => n.id === id)
      if (!src) return state
      const copy: BaseNode = {
        ...src,
        id: generateId(),
        x: src.x + 20,
        y: src.y + 20,
        isSelected: false,
        isDragging: false,
      }
      return { nodes: [...state.nodes, copy] }
    }),

  setViewport: (viewport) => set({ viewport }),
}))
