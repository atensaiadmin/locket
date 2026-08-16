import { useEffect, useState } from 'react'
import { fetchLogs, type LogsResult } from '../api'
import { Button } from './Button'

interface LogsDrawerProps {
  name: string
  onClose: () => void
}

const LEVELS = [
  { value: '', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
  { value: 'info', label: 'Info' },
]

const LINE_OPTIONS = [100, 200, 500, 1000]

// Slide-out drawer for instance logs: full viewport height, monospace
// terminal with horizontal (no-wrap) scrolling, and the dashboard stays
// visible on the left so you can cross-reference instance health.
export function LogsDrawer({ name, onClose }: LogsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState('')
  const [lines, setLines] = useState(200)
  const [follow, setFollow] = useState(false)
  const [result, setResult] = useState<LogsResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    try {
      setError(null)
      setResult(await fetchLogs(name, lines, level))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load logs')
    }
  }

  // slide-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

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

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    if (!result?.available || !result.lines.length) return
    try {
      await navigator.clipboard.writeText(result.lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const canCopy = !!result?.available && result.lines.length > 0

  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-200 ${
        open ? 'bg-slate-900/50' : 'bg-slate-900/0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Logs for ${name}`}
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Logs</h2>
            <p className="truncate font-mono text-xs text-slate-500">{name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-sm">
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
              {LINE_OPTIONS.map((n) => (
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
          <div className="ml-auto flex items-center gap-2">
            {canCopy && (
              <span className="text-xs text-slate-400">{result.lines.length} lines</span>
            )}
            <Button variant="outline" onClick={copy} disabled={!canCopy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </Button>
            <Button variant="outline" onClick={load} disabled={follow}>
              Refresh
            </Button>
          </div>
        </div>

        {/* terminal body */}
        <div className="flex-1 overflow-auto bg-slate-900">
          {error && <p className="p-4 text-sm text-rose-400">{error}</p>}
          {!error && result && !result.available && (
            <p className="p-4 text-sm text-amber-300">
              ⚠️ {result.message ?? 'Logs not available on this host.'}
            </p>
          )}
          {!error && result?.available && result.lines.length === 0 && (
            <p className="p-4 text-sm text-slate-400">No log lines to show.</p>
          )}
          {!error && result?.available && result.lines.length > 0 && (
            <pre className="min-w-full whitespace-pre p-4 font-mono text-xs leading-relaxed text-slate-100">
              {result.lines.join('\n')}
            </pre>
          )}
        </div>
      </aside>
    </div>
  )
}
