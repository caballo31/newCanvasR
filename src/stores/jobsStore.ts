import { create } from 'zustand'

export type JobStatus = 'queued' | 'running' | 'ok' | 'error'

export type Job = {
  id: string
  kind: 'summarize-selection'
  status: JobStatus
  startedAt?: number
  finishedAt?: number
  error?: string
  meta?: {
    model?: string
    inputCount?: number
    durationMs?: number
  }
}

type JobsState = {
  jobs: Job[]
  createJob: (init: { kind: Job['kind']; meta: Job['meta'] }) => string
  setRunning: (id: string) => void
  setOk: (id: string) => void
  setError: (id: string, error: string) => void
}

function now() {
  return Date.now()
}

function jobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  createJob: (init) => {
    const id = jobId()
    const j: Job = { id, kind: init.kind, status: 'queued', meta: init.meta }
    set((s) => ({ jobs: [...s.jobs, j] }))
    return id
  },
  setRunning: (id) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'running', startedAt: now() } : j)),
    }))
  },
  setOk: (id) => {
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'ok',
              finishedAt: now(),
              meta: { ...j.meta, durationMs: now() - (j.startedAt || now()) },
            }
          : j
      ),
    }))
  },
  setError: (id, error) => {
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: 'error', finishedAt: now(), error } : j
      ),
    }))
  },
}))
