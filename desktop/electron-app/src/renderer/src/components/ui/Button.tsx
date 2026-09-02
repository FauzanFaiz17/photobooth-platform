import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export default function Button({
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition',
        'hover:bg-blue-700',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
