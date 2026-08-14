export interface Instance {
  name: string
  port: string
  domain: string
  health: {
    healthy: boolean
    message?: string
    checked_at: string
  }
  ops: {
    version: string
    uptime_seconds: number
    disk_bytes: number
    disk_available: boolean
    last_backup: string
    backup_count: number
  }
}

export interface HealthPoint {
  time: string
  healthy: boolean
}

export async function fetchHistory(name: string): Promise<HealthPoint[]> {
  const res = await fetch(`/api/history/${name}`, withAuth())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---- auth ----------------------------------------------------------------

const KEY_STORAGE = 'locket.accessKey'

export function getStoredKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function storeKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, key)
  } catch {
    /* ignore */
  }
}

export function clearStoredKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

function withAuth(init?: RequestInit): RequestInit {
  const key = getStoredKey()
  const headers: Record<string, string> = {}
  if (init?.headers) {
    Object.assign(headers, init.headers)
  }
  if (key) headers['Authorization'] = `Bearer ${key}`
  return { ...init, headers }
}

export interface AuthStatus {
  setup_required: boolean
  authenticated: boolean
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch('/api/auth/status')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function setupKey(key: string): Promise<void> {
  const res = await fetch('/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
}

export async function loginKey(key: string): Promise<void> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
}

// ---- data ----------------------------------------------------------------

export async function fetchInstances(): Promise<Instance[]> {
  const res = await fetch('/api/instances', withAuth())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type Action = 'deploy' | 'restart'

export async function runAction(name: string, action: Action): Promise<string> {
  const res = await fetch(`/api/instances/${name}/${action}`, withAuth({ method: 'POST' }))
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.output ?? ''
}

export interface CreateProjectResult {
  ok: boolean
  output: string
}

export async function createProject(
  name: string,
  port: string,
  domain: string,
): Promise<CreateProjectResult> {
  const res = await fetch('/api/projects', withAuth({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, port, domain }),
  }))
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export interface LogsResult {
  available: boolean
  lines: string[]
  message?: string
}

export async function fetchLogs(
  name: string,
  lines: number,
  level: string,
): Promise<LogsResult> {
  const res = await fetch(`/api/instances/${name}/logs?lines=${lines}&level=${level}`, withAuth())
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export interface VersionInfo {
  version: string
  latest: string
  update_available: boolean
}

export async function fetchVersion(): Promise<VersionInfo> {
  const res = await fetch('/api/version', withAuth())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
