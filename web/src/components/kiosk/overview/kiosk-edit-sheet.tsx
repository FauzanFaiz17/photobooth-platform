import { useState, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { KioskIdentity } from "../types/kiosk.types"

interface KioskEditValues {
  readonly name: string
  readonly location: string
}

interface KioskEditErrors {
  readonly name?: string
  readonly location?: string
}

interface KioskEditSheetProps {
  readonly kiosk: KioskIdentity
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSave: (values: KioskEditValues) => void
}

const validateEditValues = (values: KioskEditValues): KioskEditErrors => {
  const errors: { name?: string; location?: string } = {}
  if (values.name.trim().length < 2) errors.name = "Kiosk name minimal 2 karakter."
  if (values.location.trim().length < 2) errors.location = "Location minimal 2 karakter."
  return errors
}

export function KioskEditSheet({
  kiosk,
  open,
  onOpenChange,
  onSave,
}: KioskEditSheetProps): ReactElement {
  const [values, setValues] = useState<KioskEditValues>({
    name: kiosk.name,
    location: kiosk.location,
  })
  const [errors, setErrors] = useState<KioskEditErrors>({})

  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) {
      setValues({ name: kiosk.name, location: kiosk.location })
      setErrors({})
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateEditValues(values)
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.location) return

    onSave({ name: values.name.trim(), location: values.location.trim() })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>Edit kiosk</SheetTitle>
            <SheetDescription>
              Update the public kiosk name and studio location.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="edit-kiosk-name">Kiosk name</Label>
              <Input
                id="edit-kiosk-name"
                value={values.name}
                onChange={(event) => {
                  setValues((current) => ({ ...current, name: event.target.value }))
                  setErrors((current) => ({ ...current, name: undefined }))
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "edit-kiosk-name-error" : undefined}
              />
              {errors.name && (
                <p id="edit-kiosk-name-error" className="text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kiosk-location">Location</Label>
              <Input
                id="edit-kiosk-location"
                value={values.location}
                onChange={(event) => {
                  setValues((current) => ({ ...current, location: event.target.value }))
                  setErrors((current) => ({ ...current, location: undefined }))
                }}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? "edit-kiosk-location-error" : undefined
                }
              />
              {errors.location && (
                <p id="edit-kiosk-location-error" className="text-xs text-destructive">
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Kiosk</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
