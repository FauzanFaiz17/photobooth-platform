import { Search } from "lucide-react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PartnerRecord } from "@/features/partners/partner.types";

export function CustomerFilterBar({
  search,
  partnerId,
  superAdmin,
  filtered,
  partners,
  onSubmitSearch,
  onUpdate,
  onReset,
}: {
  readonly search: string;
  readonly partnerId: number;
  readonly superAdmin: boolean;
  readonly filtered: boolean;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void;
  readonly onUpdate: (
    values: Readonly<Record<string, string | null>>,
  ) => void;
  readonly onReset: () => void;
}): ReactElement {
  return (
    <div
      className={`grid gap-3 ${superAdmin ? "sm:grid-cols-[minmax(14rem,1fr)_minmax(12rem,1fr)_auto]" : "sm:grid-cols-[minmax(14rem,1fr)_auto]"}`}
    >
      <form key={search} className="flex gap-2" onSubmit={onSubmitSearch}>
        <Label className="sr-only" htmlFor="customer-search">
          Cari Customer
        </Label>
        <Input
          id="customer-search"
          name="search"
          defaultValue={search}
          placeholder="Nama, telepon, atau email"
        />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          aria-label="Cari"
        >
          <Search aria-hidden="true" />
        </Button>
      </form>
      {superAdmin && (
        <Select
          value={partnerId ? String(partnerId) : "all"}
          onValueChange={(value) =>
            value &&
            onUpdate({
              partner_id: value === "all" ? null : value,
              page: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Partner</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={String(partner.id)}>
                {partner.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button variant="ghost" disabled={!filtered} onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
