import { useState } from 'react'
import { createProject } from '../api'
import { Button } from './Button'

interface NewProjectModalProps {
  defaultPort: string
  onClose: () => void
  onCreated: () => void
}

export function NewProjectModal({ defaultPort, onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [port, setPort] = useState(defaultPort)
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)

  const canSubmit = name.trim() && port.trim() && domain.trim() && !busy

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOutput(null)
    try {
      const res = await createProject(name.trim(), port.trim(), domain.trim())
      setOutput(res.output)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to create project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">New Project</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. idea1"
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <span className="mt-1 block text-xs text-slate-400">
              2-63 chars, lowercase letters / digits / hyphens
            </span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Port</span>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8091"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">1024-65535, must be free</span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Domain</span>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="idea1.example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">Point DNS here after creating</span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {output && (
            <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap">{output}</pre>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {busy ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
