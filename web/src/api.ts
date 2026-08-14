export interface Instance {
  name: string
  port: string
  domain: string
  health: {
    healthy: boolean
    message?: string
    checked_at: string
  }
}

export async function fetchInstances(): Promise<Instance[]> {
  const res = await fetch('/api/instances')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type Action = 'deploy' | 'restart'

export async function runAction(name: string, action: Action): Promise<string> {
  const res = await fetch(`/api/instances/${name}/${action}`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.output ?? ''
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
  const res = await fetch(`/api/instances/${name}/logs?lines=${lines}&level=${level}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}
