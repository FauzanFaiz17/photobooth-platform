import { LabelHTMLAttributes } from 'react'

export default function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className="mb-2 block text-sm font-medium text-gray-700" />
}
