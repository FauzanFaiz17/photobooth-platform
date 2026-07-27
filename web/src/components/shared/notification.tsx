import { Bell, BellOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Notification() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Buka notifikasi"
          />
        }
      >
        <Bell />
        <span className="sr-only">Buka notifikasi</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold text-foreground">
            Notifikasi
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />

          <DropdownMenuItem
            disabled
            className="flex flex-col items-center gap-0 px-6 py-10 text-center data-disabled:opacity-100"
          >
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Tidak ada notifikasi
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Notifikasi terbaru akan muncul di sini.
            </p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
