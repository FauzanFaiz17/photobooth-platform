import { FileUp, Plus } from "lucide-react"
import { useRef, type ChangeEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"

export function FramePhotoHeader({
  onImport,
  onCreate,
}: {
  readonly onImport: (file: File) => void
  readonly onCreate: () => void
}): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) onImport(file)
    event.target.value = ""
  }

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Design library</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Frame Photo</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Create, organize, and manage photo frames used across your kiosks.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input ref={inputRef} className="sr-only" type="file" accept=".png,.svg,image/png,image/svg+xml" onChange={handleFileChange} aria-label="Import PNG or SVG frame" />
        <Button variant="outline" onClick={() => inputRef.current?.click()}><FileUp aria-hidden="true" /> Import Frame</Button>
        <Button onClick={onCreate}><Plus aria-hidden="true" /> Create Frame</Button>
      </div>
    </header>
  )
}

