import { useEffect, useState } from 'react'
import { fetchInstances, runAction, type Instance } from './api'
import { Button } from './components/Button'
import { StatusDot } from './components/StatusDot'
import { LogsModal } from './components/LogsModal'

export default function App() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [logsFor, setLogsFor] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      setInstances(await fetchInstances())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load')
    }
  }

  useEffect(() => {
    load()
  }, [])

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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">
            🔒 Locket
            <span className="ml-2 text-sm font-normal text-slate-400">PocketBase fleet</span>
          </h1>
          <Button variant="ghost" onClick={load} disabled={!!busy}>
            ↻ Refresh
          </Button>
        </div>
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
                <tr key={i.name} className="hover:bg-slate-50">
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
    </div>
  )
}
