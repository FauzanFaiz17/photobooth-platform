import { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: Props) {
  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white shadow', className)}>
      {children}
    </div>
  )
}
