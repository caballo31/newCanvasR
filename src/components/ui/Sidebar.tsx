import React, { useMemo, useRef, useState } from 'react'
import type { BaseNode } from '../canvas/types/canvas'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type SidebarProps = {
  nodes: BaseNode[]
  selectedIds: string[]
  onSelectAndCenter: (id: string) => void
  // title editing
  titleEdit: { id: string | null; value: string }
  setTitleEdit: (v: { id: string | null; value: string }) => void
  onSaveTitle: (id: string, value: string) => void
}

const PALETTE = {
  text: '#3B82F6', // blue-500
  html: '#F97316', // orange-500
  media: '#10B981', // emerald-500
  folder: '#FBBF24', // amber-400
}

const TYPE_META: Record<BaseNode['type'], { label: string; color: string }> = {
  text: { label: 'text', color: PALETTE.text },
  html: { label: 'html', color: PALETTE.html },
  media: { label: 'image', color: PALETTE.media },
  folder: { label: 'folder', color: PALETTE.folder },
}

const Sidebar: React.FC<SidebarProps> = ({ nodes, selectedIds, onSelectAndCenter, titleEdit, setTitleEdit, onSaveTitle }) => {
  const [compact, setCompact] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ active: boolean; startX: number } | null>(null)

  const getCreatedAt = (n: BaseNode) => {
    try {
      const m = /shape:node_(\d+)_/.exec(n.id)
      if (m && m[1]) return parseInt(m[1], 10)
    } catch {}
    return 0
  }

  const list = useMemo(() => {
    return nodes
      .filter((n) => !n.parent && n.view !== 'fullscreen')
      .slice()
      .sort((a, b) => getCreatedAt(a) - getCreatedAt(b))
  }, [nodes])

  const handlePointerDown = (e: React.PointerEvent) => {
    const shell = shellRef.current
    if (!shell) return
    const rect = shell.getBoundingClientRect()
    const nearEdge = e.clientX - rect.left < 40
    const isGrip = (e.target as HTMLElement).closest('[data-grip]')
    if (nearEdge || isGrip) {
      dragRef.current = { active: true, startX: e.clientX }
      try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {}
    }
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current?.active) return
    const dx = e.clientX - dragRef.current.startX
    if (dx > 18) setCompact(false)
    if (dx < -18) setCompact(true)
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.active) {
      dragRef.current = null
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
    }
  }

  return (
    <div
      className="pointer-events-auto"
      style={{ position: 'absolute', top: 64, left: 10, bottom: 10, zIndex: 9000 }}
    >
      <aside
        ref={shellRef}
        className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden select-none"
        style={{
          width: compact ? '48px' : '264px',
          height: 'calc(100% - 0px)',
          transition: 'width .28s cubic-bezier(.2,.8,.2,1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Grip */}
        <div data-grip className="mx-auto mt-2 mb-1 w-[22px] h-[6px] rounded-full bg-gray-200" />
        {/* Head */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200">
          {!compact && <span className="text-sm text-gray-700">List</span>}
          <button
            type="button"
            title="Compactar / Expandir"
            className="ml-auto w-7 h-7 grid place-items-center rounded-md hover:bg-gray-100"
            onClick={() => setCompact((v) => !v)}
          >
            {compact ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {/* Body */}
        <div className="px-2 py-1 overflow-auto" style={{ height: 'calc(100% - 56px)' }}>
          <div className="flex flex-col gap-1">
            {list.map((n) => {
              const meta = TYPE_META[n.type]
              const isSel = selectedIds.includes(n.id)
              const title = n.title || (n.type[0].toUpperCase() + n.type.slice(1))
              return (
                <button
                  key={n.id}
                  className={`flex items-center ${compact ? 'justify-center px-1 py-2' : 'gap-2 px-2 py-2'} rounded-xl ${isSel ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onSelectAndCenter(n.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (!compact) setTitleEdit({ id: n.id, value: title })
                  }}
                  title={title}
                  aria-label={title}
                >
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: compact ? 12 : 8,
                      height: compact ? 12 : 8,
                      background: meta.color,
                      boxShadow: 'inset 0 0 0 1px #0001',
                    }}
                  />
                  {!compact && (
                    <>
                      {titleEdit.id === n.id ? (
                        <input
                          autoFocus
                          value={titleEdit.value}
                          onChange={(e) => setTitleEdit({ id: n.id, value: e.target.value })}
                          onPointerDown={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            if (titleEdit.id === n.id) {
                              onSaveTitle(n.id, titleEdit.value)
                              setTitleEdit({ id: null, value: '' })
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              onSaveTitle(n.id, titleEdit.value)
                              setTitleEdit({ id: null, value: '' })
                            } else if (e.key === 'Escape') {
                              setTitleEdit({ id: null, value: '' })
                            }
                          }}
                          className="px-2 py-1 rounded-md border border-gray-200 text-[13px] w-full"
                        />
                      ) : (
                        <span
                          className="text-[13px] truncate transition-all"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            setTitleEdit({ id: n.id, value: title })
                          }}
                        >
                          {title}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-gray-500 transition-all">{meta.label}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Sidebar
