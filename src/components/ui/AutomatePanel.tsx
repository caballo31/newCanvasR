import React from 'react'

type AutomatePanelProps = {
  canRun: boolean
  onRun: () => void
}

const AutomatePanel: React.FC<AutomatePanelProps> = ({ canRun, onRun }) => {
  return (
    <div className="pointer-events-auto" style={{ position: 'absolute', top: 64, right: 10, zIndex: 9000 }}>
      <aside
        className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden select-none"
        style={{ width: 240 }}
      >
        <div className="px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium">Automatizar</h3>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <button
            className={`px-3 py-2 rounded-md text-white ${canRun ? 'bg-[#F68C1E] hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'}`}
            disabled={!canRun}
            onClick={onRun}
          >
            Resumir selección
          </button>
          <p className="text-xs text-gray-500">Seleccioná 1–3 nodos de texto y ejecutá.</p>
        </div>
      </aside>
    </div>
  )
}

export default AutomatePanel
