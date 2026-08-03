import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { PartnerRecord } from "@/features/partners/partner.types"

import {
  formatPartnerDateTime,
  getPartnerPlanName,
} from "./partner-formatters"

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

export function PartnerDetailInformation({
  partner,
}: {
  readonly partner: PartnerRecord
}) {
  const subscription = partner.subscription

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Informasi partner</CardTitle>
        <CardDescription>
          Informasi ini ditampilkan sesuai data dari server.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <section aria-labelledby="partner-contact-information">
          <h2
            id="partner-contact-information"
            className="text-sm font-semibold text-foreground"
          >
            Identitas dan kontak
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <DetailField
              label="Nama perusahaan"
              value={partner.company_name}
            />
            <DetailField
              label="Nama brand"
              value={partner.brand_name || "—"}
            />
            <DetailField label="Email" value={partner.email} />
            <DetailField label="Nomor telepon" value={partner.phone || "—"} />
            <DetailField label="NPWP" value={partner.tax_number || "—"} />
            <DetailField label="Status" value={partner.status} />
          </dl>
          <div className="mt-5">
            <DetailField label="Alamat" value={partner.address || "—"} />
          </div>
        </section>

        <Separator />

        <section aria-labelledby="partner-subscription-information">
          <h2
            id="partner-subscription-information"
            className="text-sm font-semibold text-foreground"
          >
            Langganan aktif
          </h2>
          {subscription ? (
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <DetailField label="Paket" value={getPartnerPlanName(partner)} />
              <DetailField label="Status" value={subscription.status} />
              <DetailField
                label="Mulai"
                value={formatPartnerDateTime(subscription.starts_at)}
              />
              <DetailField
                label="Berakhir"
                value={formatPartnerDateTime(subscription.ends_at)}
              />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Partner ini tidak memiliki langganan berstatus active. Riwayat
              langganan belum tersedia karena API hanya mengirim langganan
              yang sedang aktif.
            </p>
          )}
        </section>

        <Separator />

        <section aria-labelledby="partner-system-information">
          <h2
            id="partner-system-information"
            className="text-sm font-semibold text-foreground"
          >
            Sistem
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <DetailField label="ID partner" value={String(partner.id)} />
            <DetailField label="Slug" value={partner.slug} mono />
            <DetailField
              label="Tanggal dibuat"
              value={formatPartnerDateTime(partner.created_at)}
            />
          </dl>
        </section>
      </CardContent>
    </Card>
  )
}
