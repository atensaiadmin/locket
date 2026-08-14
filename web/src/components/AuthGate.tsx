import { useState } from 'react'
import { setupKey, loginKey } from '../api'

interface AuthGateProps {
  mode: 'setup' | 'login'
  onAuthed: (key: string) => void
}

// First-run "set your access key" (mirrors PocketBase's create-first-admin)
// or a plain login screen. Both share the same look.
export function AuthGate({ mode, onAuthed }: AuthGateProps) {
  const [key, setKey] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'setup' && key !== confirm) {
      setError('Access keys do not match')
      return
    }
    if (key.length < 8) {
      setError('Access key must be at least 8 characters')
      return
    }
    setBusy(true)
    try {
      if (mode === 'setup') {
        await setupKey(key)
      } else {
        await loginKey(key)
      }
      onAuthed(key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/src/assets/icon2.svg" alt="Locket" className="mx-auto h-12 w-12" />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Locket</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'setup' ? 'Set your access key to secure this dashboard' : 'Enter your access key'}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            {mode === 'setup' ? 'New access key' : 'Access key'}
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          {mode === 'setup' && (
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Confirm access key
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>
          )}

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? '…' : mode === 'setup' ? 'Set access key' : 'Unlock'}
          </button>
        </form>

        {mode === 'setup' && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Stored locally on your server (hashed). Same pattern as PocketBase's
            first admin.
          </p>
        )}
      </div>
    </div>
  )
}
