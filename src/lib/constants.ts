export const SCHEMA_VERSION = 1
export const APP_NAME = 'risspo-lienzo'

export const NODE_TYPES = {
  TEXT: 'text',
  MEDIA: 'media',
  HTML: 'html',
  FOLDER: 'folder',
} as const

// General view modes for nodes
export const VIEW_MODES = {
  COMPACT: 'compact',
  WINDOW: 'window',
  FULLSCREEN: 'fullscreen',
} as const

// Backwards-compat alias (some code might still import this)
export const FOLDER_VIEWS = VIEW_MODES

// Grid snap size (world space units)
export const GRID_SIZE = 24

// Compact node visual size used for layout math when view !== 'window' | 'fullscreen'
export const COMPACT_NODE_SIZE = { width: 105, height: 105 } as const

// Z-Stack bands and priorities (lower = farther back)
export const Z_BANDS = {
  COMPACT: 100, // compact items, icons
  WINDOWS: 200, // regular windows (text/media/html)
  FOLDER_WINDOWS: 250, // folder windows must float above normal windows
  OVERLAYS: 900, // tooltips, ghosts, menus (pointer-events: none by default)
  MODALS: 1000, // blocking modals
} as const

export type ZBandKey = keyof typeof Z_BANDS

