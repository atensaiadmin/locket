import { useEffect, useState } from 'react'
import { fetchLogs, type LogsResult } from '../api'
import { Button } from './Button'

interface LogsModalProps {
  name: string
  onClose: () => void
}

const LEVELS = [
  { value: '', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
  { value: 'info', label: 'Info' },
]

export function LogsModal({ name, onClose }: LogsModalProps) {
  const [level, setLevel] = useState('')
  const [lines, setLines] = useState(100)
  const [follow, setFollow] = useState(false)
  const [result, setResult] = useState<LogsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      setResult(await fetchLogs(name, lines, level))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load logs')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  // live tail: poll every 3s while "follow" is on
  useEffect(() => {
    if (!follow) return
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [follow, level, lines])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Logs — {name}</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">Lines</span>
            <select
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {[100, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={follow}
              onChange={(e) => setFollow(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-slate-600">Follow</span>
          </label>
          <div className="ml-auto">
            <Button onClick={load} disabled={follow}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-900 p-4">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!error && result && !result.available && (
            <p className="text-sm text-amber-300">
              ⚠️ {result.message ?? 'Logs not available on this host.'}
            </p>
          )}
          {!error && result?.available && result.lines.length === 0 && (
            <p className="text-sm text-slate-400">No log lines to show.</p>
          )}
          {!error && result?.available && result.lines.length > 0 && (
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-100">
              {result.lines.join('\n')}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
