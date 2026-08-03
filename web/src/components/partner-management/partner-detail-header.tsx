import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { resolvePartnerLogoUrl } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"

import {
  createPartnerInitials,
  getPartnerDisplayName,
} from "./partner-formatters"
import { PartnerStatusBadge } from "./partner-status-badge"

interface PartnerDetailHeaderProps {
  readonly partner: PartnerRecord
  readonly returnTo: string
  readonly onEdit: () => void
  readonly onDelete: () => void
}

export function PartnerDetailHeader({
  partner,
  returnTo,
  onEdit,
  onDelete,
}: PartnerDetailHeaderProps) {
  const logoUrl = resolvePartnerLogoUrl(partner.logo)

  return (
    <header className="space-y-5">
      <Button
        variant="ghost"
        className="-ml-2"
        render={<Link to={returnTo} />}
      >
        <ArrowLeft aria-hidden="true" />
        Kembali ke Partners
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16">
          {logoUrl && (
            <AvatarImage
              src={logoUrl}
              alt={getPartnerDisplayName(partner)}
            />
          )}
          <AvatarFallback className="text-lg font-semibold">
            {createPartnerInitials(partner.company_name) || "PT"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Partner #{partner.id}
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
            {partner.company_name}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {partner.brand_name
              ? `${partner.brand_name} · ${partner.slug}`
              : partner.slug}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PartnerStatusBadge status={partner.status} />
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Hapus partner ${partner.company_name}`}
            title="Hapus partner"
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
