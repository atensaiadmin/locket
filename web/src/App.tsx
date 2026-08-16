import { useEffect, useState } from 'react'
import {
  fetchInstances,
  fetchVersion,
  fetchHistory,
  runAction,
  fetchAuthStatus,
  storeKey,
  clearStoredKey,
  type Instance,
  type HealthPoint,
  type VersionInfo,
} from './api'
import { Button } from './components/Button'
import { StatusDot } from './components/StatusDot'
import { LogsDrawer } from './components/LogsDrawer'
import { AuthGate } from './components/AuthGate'
import { Sparkline } from './components/Sparkline'
import { NewProjectModal } from './components/NewProjectModal'
import locketIcon from './assets/icon2.svg'

function fmtUptime(s: number): string {
  if (!s) return '–'
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtBytes(b: number): string {
  if (!b) return '–'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let n = b
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

export default function App() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [history, setHistory] = useState<Record<string, HealthPoint[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [outputError, setOutputError] = useState(false)
  const [logsFor, setLogsFor] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [version, setVersion] = useState<VersionInfo | null>(null)
  const [auth, setAuth] = useState<'loading' | 'setup' | 'login' | 'ready'>('loading')

  const load = async () => {
    try {
      setError(null)
      const data = await fetchInstances()
      setInstances(data)
      // fetch history per instance (best-effort, ignore failures)
      const h: Record<string, HealthPoint[]> = {}
      await Promise.all(
        data.map(async (i) => {
          try {
            h[i.name] = await fetchHistory(i.name)
          } catch {
            /* ignore */
          }
        }),
      )
      setHistory(h)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load')
    }
  }

  const loadVersion = () => fetchVersion().then(setVersion).catch(() => {})

  useEffect(() => {
    ;(async () => {
      try {
        const status = await fetchAuthStatus()
        if (status.setup_required) {
          setAuth('setup')
        } else if (status.authenticated) {
          setAuth('ready')
          await load()
          loadVersion()
        } else {
          setAuth('login')
        }
      } catch {
        setAuth('login')
      }
    })()
  }, [])

  const onAuthed = async (key: string) => {
    storeKey(key)
    setAuth('ready')
    await load()
    loadVersion()
  }

  const logout = () => {
    clearStoredKey()
    setAuth('login')
    setInstances([])
    setVersion(null)
  }

  const act = async (name: string, action: 'deploy' | 'restart') => {
    // Clear any previous output so a new action starts clean (previously a
    // stale error stayed on screen until the page was refreshed).
    setBusy(`${name}:${action}`)
    setOutput(null)
    setOutputError(false)
    try {
      setOutput(await runAction(name, action))
      await load()
    } catch (e) {
      const err = e as Error & { output?: string }
      setOutput(err.output ? `${err.message}\n\n${err.output}` : (e instanceof Error ? e.message : 'action failed'))
      setOutputError(true)
    } finally {
      setBusy(null)
    }
  }

  // suggest the next free port (max used + 1), starting at 8091
  const nextPort = () => {
    const used = instances
      .map((i) => Number(i.port))
      .filter((n) => !Number.isNaN(n))
    const max = used.length ? Math.max(...used) : 8090
    return String(max + 1)
  }

  const onProjectCreated = async () => {
    await load()
  }

  return (
    <div className="min-h-screen">
      {auth === 'setup' && <AuthGate mode="setup" onAuthed={onAuthed} />}
      {auth === 'login' && <AuthGate mode="login" onAuthed={onAuthed} />}
      {auth === 'ready' && (
        <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src={locketIcon} alt="" className="h-6 w-6" />
            <span>
              Locket
              <span className="ml-2 text-sm font-normal text-slate-400">PocketBase fleet</span>
            </span>
            {version && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                v{version.version.replace(/^v/, '')}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreating(true)} disabled={!!busy}>
              ＋ New Project
            </Button>
            <Button variant="ghost" onClick={load} disabled={!!busy}>
              ↻ Refresh
            </Button>
            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
        {version?.update_available && (
          <div className="border-t border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
            ✨ New version available: <strong>v{version.latest.replace(/^v/, '')}</strong> (you're on v
            {version.version.replace(/^v/, '')}).{' '}
            <a
              href={`https://github.com/${'atensaiadmin'}/locket/releases`}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2 hover:text-amber-900"
            >
              View releases
            </a>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {instances.length === 0 && !error ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-sm text-slate-500">No instances found in projects.conf</p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              ＋ New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {instances.map((i) => (
              <article
                key={i.name}
                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{i.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <a
                        href={`https://${i.domain}/_/`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-slate-300 hover:text-slate-900"
                      >
                        {i.domain}
                      </a>
                      <span className="mx-1.5 text-slate-300">•</span>
                      Port {i.port}
                    </p>
                  </div>
                  <StatusDot healthy={i.health.healthy} />
                </div>

                <div className="mt-4 border-y border-slate-100 bg-slate-50/60 px-5 py-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <p className="text-slate-400">Uptime</p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {fmtUptime(i.ops?.uptime_seconds ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Disk</p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {i.ops?.disk_available ? fmtBytes(i.ops.disk_bytes) : '–'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Backups</p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {i.ops?.backup_count ? `${i.ops.backup_count}` : '–'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">PB</p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {i.ops?.version ? `v${i.ops.version.replace(/^v/, '')}` : '–'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <p className="text-slate-400">History</p>
                    <Sparkline points={history[i.name] ?? []} />
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 px-5 py-4">
                  <Button variant="outline" onClick={() => setLogsFor(i.name)}>
                    Logs
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => act(i.name, 'restart')}
                  >
                    Restart
                  </Button>
                  <Button
                    variant="outline"
                    className="ml-auto"
                    disabled={!!busy}
                    onClick={() => act(i.name, 'deploy')}
                  >
                    {busy === `${i.name}:deploy` ? 'Deploying…' : 'Deploy'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {output !== null && (
          <div
            className={`mt-4 overflow-hidden rounded-lg border bg-slate-900 text-xs text-slate-100 ${
              outputError ? 'border-rose-500/50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  outputError ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {outputError ? '✕ Action failed' : 'Output'}
              </span>
              <button
                onClick={() => {
                  setOutput(null)
                  setOutputError(false)
                }}
                aria-label="Dismiss output"
                className="rounded px-1.5 text-sm leading-none text-slate-400 hover:bg-slate-700/50 hover:text-slate-100"
              >
                ✕
              </button>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4">{output}</pre>
          </div>
        )}
      </main>

      {logsFor && <LogsDrawer name={logsFor} onClose={() => setLogsFor(null)} />}
      {creating && (
        <NewProjectModal
          defaultPort={nextPort()}
          onClose={() => setCreating(false)}
          onCreated={onProjectCreated}
        />
      )}
        </>
      )}
    </div>
  )
}
