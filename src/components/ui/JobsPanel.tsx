import React from 'react'
import { useJobsStore } from '../../stores/jobsStore'

const JobsPanel: React.FC = () => {
  const jobs = useJobsStore((s) => s.jobs)
  return (
    <div className="pointer-events-auto" style={{ position: 'absolute', right: 10, bottom: 10, zIndex: 9000 }}>
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] p-2 min-w-[260px]">
        <h3 className="text-sm font-medium mb-1">Jobs</h3>
        <ul className="text-[12px] text-gray-700 flex flex-col gap-1 max-h-[160px] overflow-auto">
          {jobs.length === 0 && <li className="text-gray-400">Sin jobs aún</li>}
          {jobs.map((j) => (
            <li key={j.id} className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full border text-[11px]"
                style={{
                  background: j.status === 'ok' ? '#ecfdf5' : j.status === 'error' ? '#fef2f2' : '#f9fafb',
                  borderColor: j.status === 'ok' ? '#10b981' : j.status === 'error' ? '#ef4444' : '#e5e7eb',
                  color: j.status === 'ok' ? '#065f46' : j.status === 'error' ? '#991b1b' : '#374151',
                }}
              >{j.status}</span>
              <span>{j.kind}</span>
              {j.meta?.model && <span className="text-gray-500">({j.meta.model})</span>}
              {j.finishedAt && j.startedAt && (
                <span className="ml-auto text-gray-500">{j.finishedAt - j.startedAt} ms</span>
              )}
              {j.status === 'error' && j.error && (
                <span className="ml-auto text-red-600" title={j.error}>error</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default JobsPanel
