export function StatusDot({ healthy }: { healthy: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          healthy ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      <span className={healthy ? 'text-emerald-700' : 'text-rose-700'}>
        {healthy ? 'healthy' : 'down'}
      </span>
    </span>
  )
}
