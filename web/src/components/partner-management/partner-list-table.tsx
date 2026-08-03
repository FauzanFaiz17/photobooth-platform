import { Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { resolvePartnerLogoUrl } from "@/features/partners/partner-service"

import {
  createPartnerInitials,
  formatPartnerDateTime,
  getPartnerDisplayName,
  getPartnerPlanName,
  getPartnerPlanPeriod,
} from "./partner-formatters"
import { PartnerStatusBadge } from "./partner-status-badge"

interface PartnerListTableProps {
  readonly partners: ReadonlyArray<PartnerRecord>
  readonly returnTo: string
  readonly onEdit: (partner: PartnerRecord) => void
  readonly onDelete: (partner: PartnerRecord) => void
}

export function PartnerListTable({
  partners,
  returnTo,
  onEdit,
  onDelete,
}: PartnerListTableProps) {
  return (
    <Table>
      <TableCaption className="sr-only">
        Daftar partner yang terdaftar di platform
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">Partner</TableHead>
          <TableHead>Kontak</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Langganan</TableHead>
          <TableHead>Dibuat</TableHead>
          <TableHead className="pr-6 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partners.map((partner) => {
          const displayName = getPartnerDisplayName(partner)
          const logoUrl = resolvePartnerLogoUrl(partner.logo)
          const planPeriod = getPartnerPlanPeriod(partner)

          return (
            <TableRow key={partner.id}>
              <TableCell className="min-w-64 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {logoUrl && (
                      <AvatarImage src={logoUrl} alt={displayName} />
                    )}
                    <AvatarFallback>
                      {createPartnerInitials(partner.company_name) || "PT"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {partner.company_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {partner.brand_name
                        ? `${partner.brand_name} · ${partner.slug}`
                        : partner.slug}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="min-w-56">
                <p className="truncate text-foreground">{partner.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {partner.phone || "Tanpa nomor telepon"}
                </p>
              </TableCell>
              <TableCell>
                <PartnerStatusBadge status={partner.status} />
              </TableCell>
              <TableCell className="min-w-40">
                <p className="text-foreground">
                  {getPartnerPlanName(partner)}
                </p>
                {planPeriod && (
                  <p className="text-xs text-muted-foreground">
                    {planPeriod}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatPartnerDateTime(partner.created_at)}
              </TableCell>
              <TableCell className="pr-6">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        to={`/admin/settings/partners/${partner.id}`}
                        state={{ from: returnTo }}
                      />
                    }
                  >
                    Lihat detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit partner ${partner.company_name}`}
                    title="Edit partner"
                    onClick={() => onEdit(partner)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Hapus partner ${partner.company_name}`}
                    title="Hapus partner"
                    onClick={() => onDelete(partner)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
