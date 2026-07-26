import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface KioskSettingRowProps {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
  readonly disabled?: boolean
}

export function KioskSettingRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: KioskSettingRowProps): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-description`} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={`${id}-description`}
      />
    </div>
  )
}
import type { ReactElement } from "react"
