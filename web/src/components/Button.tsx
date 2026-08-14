interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-700'
      : 'bg-transparent text-slate-600 hover:bg-slate-200'

  return <button className={`${base} ${styles} ${className}`} {...props} />
}
