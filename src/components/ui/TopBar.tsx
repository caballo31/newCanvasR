import React from 'react'
import { FolderOpen, Save, Focus, Share } from 'lucide-react'

type TopBarProps = {
  onOpen: () => void
  onSave: () => void
  onCenter: () => void
  onExport: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onOpen, onSave, onCenter, onExport }) => {
  return (
    <div className="absolute top-2 left-0 right-0 z-[10000] pointer-events-none">
      <div className="max-w-full mx-2 flex items-center justify-between">
        {/* Left chip */}
        <div className="pointer-events-auto flex items-center gap-2 px-2 py-1 border border-gray-200 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="w-6 h-6 rounded-lg bg-[#F68C1E] text-white font-bold grid place-items-center text-[12px]">R</div>
          <strong className="text-sm">Risspo</strong>
        </div>
        {/* Right group chip with buttons */}
        <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 border border-gray-200 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <button className="w-8 h-8 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Abrir" onClick={(e)=>{ e.stopPropagation(); onOpen() }}>
            <FolderOpen className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Guardar" onClick={(e)=>{ e.stopPropagation(); onSave() }}>
            <Save className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Centrar" onClick={(e)=>{ e.stopPropagation(); onCenter() }}>
            <Focus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Exportar" onClick={(e)=>{ e.stopPropagation(); onExport() }}>
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopBar
