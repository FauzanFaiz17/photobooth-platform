import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { UserRecord } from "@/features/users/user.types"

import { formatUserDate } from "./user-formatters"

function DetailField({
  label,
  value,
  mono = false,
}: {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  )
}

export function UserDetailInformation({
  user,
}: {
  readonly user: UserRecord
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Informasi user</CardTitle>
        <CardDescription>
          Informasi ini ditampilkan sesuai data dari server.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <section aria-labelledby="contact-information">
          <h2
            id="contact-information"
            className="text-sm font-semibold text-foreground"
          >
            Identitas dan kontak
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <DetailField label="Nama" value={user.name} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Nomor telepon" value={user.phone || "—"} />
            <DetailField label="Status" value={user.status} />
          </dl>
        </section>

        <Separator />

        <section aria-labelledby="access-information">
          <h2
            id="access-information"
            className="text-sm font-semibold text-foreground"
          >
            Akses dan organisasi
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <DetailField
              label="Role"
              value={user.role.name ?? "Tanpa role"}
            />
            <DetailField
              label="Role slug"
              value={user.role.slug ?? "—"}
              mono
            />
            <DetailField
              label="Brand partner"
              value={user.partner?.brand_name || "—"}
            />
            <DetailField
              label="Perusahaan"
              value={user.partner?.company_name ?? "Tidak terikat partner"}
            />
          </dl>
        </section>

        <Separator />

        <section aria-labelledby="account-activity">
          <h2
            id="account-activity"
            className="text-sm font-semibold text-foreground"
          >
            Aktivitas akun
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <DetailField
              label="Terakhir login"
              value={formatUserDate(user.last_login_at, "Belum pernah")}
            />
            <DetailField
              label="Tanggal dibuat"
              value={formatUserDate(user.created_at)}
            />
          </dl>
        </section>
      </CardContent>
    </Card>
  )
}
