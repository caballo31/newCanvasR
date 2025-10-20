import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CanvasState, CanvasActions, UINode, FolderNode } from '../components/canvas/types/canvas'
import { SCHEMA_VERSION, APP_NAME } from '../lib/constants'
import { generateId } from '../lib/utils'

const initialState: CanvasState = {
  nodes: {},
  selectedNodes: [],
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
}

// Función para migrar IDs viejos
const migrateNodeIds = (nodes: Record<string, UINode>): Record<string, UINode> => {
  const migrated: Record<string, UINode> = {}

  Object.values(nodes).forEach((node) => {
    const newId = node.id.startsWith('shape:') ? node.id : generateId()
    migrated[newId] = { ...node, id: newId }
  })

  return migrated
}

export const useCanvasStore = create<CanvasState & CanvasActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addNode: (node: UINode) => {
        // Asegurar que el ID empiece con "shape:"
        const validatedNode = {
          ...node,
          id: node.id.startsWith('shape:') ? node.id : generateId(),
        }

        set((state) => ({
          nodes: {
            ...state.nodes,
            [validatedNode.id]: validatedNode,
          },
        }))
      },

      updateNode: (id: string, updates: Partial<UINode>) => {
        set((state) => {
          const node = state.nodes[id]
          if (!node) return state

          return {
            nodes: {
              ...state.nodes,
              [id]: { ...node, ...updates },
            },
          }
        })
      },

      removeNode: (id: string) => {
        set((state) => {
          const nodes = { ...state.nodes }
          const node = nodes[id]

          // Remove from parent folders
          if (node) {
            Object.values(nodes).forEach((n) => {
              if (n.type === 'folder' && n.children.includes(id)) {
                ;(n as FolderNode).children = n.children.filter((childId) => childId !== id)
              }
            })
          }

          // Remove the node itself
          delete nodes[id]

          // Remove selection if needed
          const selectedNodes = state.selectedNodes.filter((selectedId) => selectedId !== id)

          return {
            nodes,
            selectedNodes,
          }
        })
      },

      setSelectedNodes: (ids: string[]) => {
        set({ selectedNodes: ids })
      },

      addToFolder: (nodeId: string, folderId: string) => {
        set((state) => {
          const folder = state.nodes[folderId] as FolderNode | undefined
          const node = state.nodes[nodeId]

          if (!folder || folder.type !== 'folder' || !node) {
            return state
          }

          // Remove from other folders
          Object.values(state.nodes).forEach((n) => {
            if (n.type === 'folder' && n.children.includes(nodeId)) {
              ;(n as FolderNode).children = n.children.filter((childId) => childId !== nodeId)
            }
          })

          // Add to new folder
          const updatedFolder: FolderNode = {
            ...folder,
            children: [...folder.children, nodeId],
          }

          return {
            nodes: {
              ...state.nodes,
              [folderId]: updatedFolder,
            },
          }
        })
      },

      removeFromFolder: (nodeId: string, folderId: string) => {
        set((state) => {
          const folder = state.nodes[folderId] as FolderNode | undefined
          if (!folder || folder.type !== 'folder') {
            return state
          }

          const updatedFolder: FolderNode = {
            ...folder,
            children: folder.children.filter((id) => id !== nodeId),
          }

          return {
            nodes: {
              ...state.nodes,
              [folderId]: updatedFolder,
            },
          }
        })
      },

      setFolderView: (folderId: string, view: 'compact' | 'window') => {
        set((state) => {
          const folder = state.nodes[folderId] as FolderNode | undefined
          if (!folder || folder.type !== 'folder') {
            return state
          }

          return {
            nodes: {
              ...state.nodes,
              [folderId]: { ...folder, view },
            },
          }
        })
      },

      minimizeNode: (nodeId: string) => {
        set((state) => {
          const node = state.nodes[nodeId]
          if (!node) return state

          return {
            nodes: {
              ...state.nodes,
              [nodeId]: { ...node, minimized: !node.minimized },
            },
          }
        })
      },

      setViewport: (viewport: CanvasState['viewport']) => {
        set({ viewport })
      },

      loadState: (state: CanvasState) => {
        set(state)
      },

      clearState: () => {
        set(initialState)
      },
    }),
    {
      name: `${APP_NAME}-v${SCHEMA_VERSION}`,
      version: SCHEMA_VERSION,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrar IDs viejos
          if (persistedState.nodes) {
            persistedState.nodes = migrateNodeIds(persistedState.nodes)
          }
        }
        return persistedState
      },
    }
  )
)

// Exponer store globalmente para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  ;(window as any).__RISSPO_STORE = useCanvasStore
}
