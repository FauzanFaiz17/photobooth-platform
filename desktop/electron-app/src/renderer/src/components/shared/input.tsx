import React, { forwardRef } from 'react'

export interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const baseInputStyle =
      'bg-white border-[3px] p-3 text-[var(--foreground)] font-semibold rounded-none transition-all duration-75 focus:outline-none focus:translate-x-[2px] focus:translate-y-[0px] placeholder:text-[var(--muted-foreground)] disabled:opacity-60 disabled:bg-[var(--background)] disabled:cursor-not-allowed w-full'

    const normalStyle =
      'border-[var(--border)] shadow-[4px_4px_0_0_var(--border)] focus:shadow-[2px_2px_0_0_var(--border)]'

    const errorStyle =
      'border-[var(--danger)] shadow-[4px_4px_0_0_var(--danger)] focus:shadow-[2px_2px_0_0_var(--danger)] text-[var(--danger)]'

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Label Opsional */}
        {label && (
          <label className="font-bold text-[var(--foreground)] uppercase tracking-wide text-sm">
            {label}
          </label>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          className={`${baseInputStyle} ${error ? errorStyle : normalStyle} ${className}`}
          {...props}
        />

        {/* Error Message Opsional */}
        {error && (
          <span className="text-[var(--danger)] font-bold text-sm bg-white inline-block w-fit px-2 py-0.5 border-2 border-[var(--danger)] shadow-[2px_2px_0_0_var(--danger)]">
            {error}
          </span>
        )}
      </div>
    )
  }
)

NeoInput.displayName = 'NeoInput'
