import React from 'react'
import { Type, FileImage, Code, Folder } from 'lucide-react'

type DockProps = {
  onNewText: () => void
  onNewImage: () => void
  onNewHTML: () => void
  onNewFolder: () => void
}

const Dock: React.FC<DockProps> = ({ onNewText, onNewImage, onNewHTML, onNewFolder }) => {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-2 z-[10000] pointer-events-none">
      <div className="pointer-events-auto border border-gray-200 bg-white/95 backdrop-saturate-150 backdrop-blur-md rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex gap-1 p-1">
        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Texto" onClick={(e)=>{ e.stopPropagation(); onNewText() }}>
          <Type className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Imagen" onClick={(e)=>{ e.stopPropagation(); onNewImage() }}>
          <FileImage className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="HTML" onClick={(e)=>{ e.stopPropagation(); onNewHTML() }}>
          <Code className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white grid place-items-center hover:bg-gray-100" title="Carpeta" onClick={(e)=>{ e.stopPropagation(); onNewFolder() }}>
          <Folder className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Dock
