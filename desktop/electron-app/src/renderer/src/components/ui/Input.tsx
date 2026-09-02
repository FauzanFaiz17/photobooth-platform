import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-lg border border-gray-300 px-3 py-2',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        className
      )}
    />
  )
}
