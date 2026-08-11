import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { UserRecord } from "@/features/users/user.types"
import { resolveStorageUrl } from "@/lib/api-client"

import { createUserInitials } from "./user-formatters"
import { UserStatusBadge } from "./user-status-badge"

interface UserDetailHeaderProps {
  readonly user: UserRecord
  readonly returnTo: string
  readonly onEdit: () => void
  readonly onDelete: () => void
}

export function UserDetailHeader({
  user,
  returnTo,
  onEdit,
  onDelete,
}: UserDetailHeaderProps) {
  const avatarUrl = resolveStorageUrl(user.avatar)

  return (
    <header className="space-y-5">
      <Button
        variant="ghost"
        className="-ml-2"
        render={<Link to={returnTo} />}
      >
        <ArrowLeft aria-hidden="true" />
        Kembali ke Users
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
          <AvatarFallback className="text-lg font-semibold">
            {createUserInitials(user.name) || "US"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            User #{user.id}
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
            {user.name}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UserStatusBadge status={user.status} />
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Hapus
          </Button>
        </div>
      </div>
    </header>
  )
}
