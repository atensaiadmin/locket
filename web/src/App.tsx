import { Fragment, useEffect, useState } from 'react'
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
import { LogsModal } from './components/LogsModal'
import { AuthGate } from './components/AuthGate'
import { Sparkline } from './components/Sparkline'
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
  const [logsFor, setLogsFor] = useState<string | null>(null)
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
    setBusy(`${name}:${action}`)
    try {
      setOutput(await runAction(name, action))
      await load()
    } catch (e) {
      setOutput(e instanceof Error ? e.message : 'action failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen">
      {auth === 'setup' && <AuthGate mode="setup" onAuthed={onAuthed} />}
      {auth === 'login' && <AuthGate mode="login" onAuthed={onAuthed} />}
      {auth === 'ready' && (
        <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Port</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instances.map((i) => (
                <Fragment key={i.name}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3">
                      <StatusDot healthy={i.health.healthy} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{i.port}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://${i.domain}/_/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-700 underline decoration-slate-300 hover:text-slate-900"
                      >
                        {i.domain}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setLogsFor(i.name)}>
                          Logs
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={!!busy}
                          onClick={() => act(i.name, 'restart')}
                        >
                          Restart
                        </Button>
                        <Button disabled={!!busy} onClick={() => act(i.name, 'deploy')}>
                          {busy === `${i.name}:deploy` ? 'Deploying…' : 'Deploy'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td colSpan={5} className="px-4 pb-3">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">Uptime</span>
                          <span className="font-medium text-slate-700">{fmtUptime(i.ops?.uptime_seconds ?? 0)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">Disk</span>
                          <span className="font-medium text-slate-700">
                            {i.ops?.disk_available ? fmtBytes(i.ops.disk_bytes) : '–'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">Backups</span>
                          <span className="font-medium text-slate-700">
                            {i.ops?.backup_count ? `${i.ops.backup_count}` : '–'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">PB</span>
                          <span className="font-medium text-slate-700">
                            {i.ops?.version ? `v${i.ops.version.replace(/^v/, '')}` : '–'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">History</span>
                          <Sparkline points={history[i.name] ?? []} />
                        </span>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
              {instances.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No instances found in projects.conf
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {output && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </main>

      {logsFor && <LogsModal name={logsFor} onClose={() => setLogsFor(null)} />}
        </>
      )}
    </div>
  )
}
