import { Upload, X } from "lucide-react"
import { useId, type ChangeEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"

interface KioskAssetUploadProps {
  readonly label: string
  readonly fileName?: string
  readonly accept?: string
  readonly onFileChange: (fileName: string | undefined) => void
}

export function KioskAssetUpload({
  label,
  fileName,
  accept = "image/*",
  onFileChange,
}: KioskAssetUploadProps): ReactElement {
  const inputId = useId()

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFileChange(event.target.files?.[0]?.name)
  }

  return (
    <div className="flex min-h-14 items-center gap-2 rounded-lg border border-dashed p-3">
      <label
        htmlFor={inputId}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm"
      >
        <Upload className="size-4 shrink-0 opacity-60" aria-hidden="true" />
        <span className="truncate">{fileName ?? label}</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />
      {fileName && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onFileChange(undefined)}
          aria-label={`Hapus ${label}`}
        >
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
