import { Eye, EyeOff } from "lucide-react"
import { useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaymentKeyCredentialFieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly placeholder: string
  readonly secret?: boolean
  readonly error?: string
  readonly description?: string
  readonly onChange: (value: string) => void
}

export function PaymentKeyCredentialField({
  id,
  label,
  value,
  placeholder,
  secret = false,
  error,
  description,
  onChange,
}: PaymentKeyCredentialFieldProps): ReactElement {
  const [visible, setVisible] = useState(false)
  const concealed = secret && !visible

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={concealed ? "password" : "text"}
          value={value}
          placeholder={placeholder}
          className={secret ? "pr-10" : undefined}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {secret && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={visible ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs opacity-70" role="alert">
          {error}
        </p>
      ) : description ? (
        <p id={`${id}-description`} className="text-xs opacity-70">
          {description}
        </p>
      ) : null}
    </div>
  )
}
