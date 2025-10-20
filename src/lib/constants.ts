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
