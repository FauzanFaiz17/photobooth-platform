import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { UserRecord } from "@/features/users/user.types"
import { resolveStorageUrl } from "@/lib/api-client"
import { Link } from "react-router-dom"

import {
  createUserInitials,
  formatUserDate,
  getUserPartnerName,
} from "./user-formatters"
import { UserStatusBadge } from "./user-status-badge"

export function UserListTable({
  users,
  returnTo,
}: {
  readonly users: ReadonlyArray<UserRecord>
  readonly returnTo: string
}) {
  return (
    <Table>
      <TableCaption className="sr-only">
        Daftar akun pengguna yang terdaftar
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Partner</TableHead>
          <TableHead>Telepon</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Terakhir login</TableHead>
          <TableHead>Dibuat</TableHead>
          <TableHead className="pr-6 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const avatarUrl = resolveStorageUrl(user.avatar)

          return (
            <TableRow key={user.id}>
              <TableCell className="min-w-64 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={user.name} />
                    )}
                    <AvatarFallback>
                      {createUserInitials(user.name) || "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.role.name ?? "Tanpa role"}</TableCell>
              <TableCell>{getUserPartnerName(user)}</TableCell>
              <TableCell>{user.phone || "—"}</TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatUserDate(user.last_login_at, "Belum pernah")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatUserDate(user.created_at)}
              </TableCell>
              <TableCell className="pr-6 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      to={`/admin/settings/users/${user.id}`}
                      state={{ from: returnTo }}
                    />
                  }
                >
                  Lihat detail
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
