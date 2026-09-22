import { Search } from "lucide-react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
} from "@/features/payments/payment.types";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { gatewayLabels, statusLabelsPayment } from "@/constants";

export function TransactionFilters({
  superAdmin,
  search,
  gateway,
  status,
  partnerId,
  filtered,
  partners,
  onFilterChange,
  onReset,
  onSearch,
}: {
  readonly superAdmin: boolean;
  readonly search: string;
  readonly gateway: string | undefined;
  readonly status: string | undefined;
  readonly partnerId: number;
  readonly filtered: boolean;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly onFilterChange: (updates: Record<string, string | null>) => void;
  readonly onReset: () => void;
  readonly onSearch: (event: FormEvent<HTMLFormElement>) => void;
}): ReactElement {
  return (
    <div
      className={`grid gap-3 ${superAdmin ? "lg:grid-cols-[1fr_repeat(3,13rem)_auto]" : "lg:grid-cols-[1fr_repeat(2,13rem)_auto]"}`}
    >
      <form key={search} className="flex gap-2" onSubmit={onSearch}>
        <Input
          name="search"
          defaultValue={search}
          placeholder="Cari reference"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          aria-label="Cari"
        >
          <Search />
        </Button>
      </form>
      {superAdmin && (
        <Select
          value={partnerId ? String(partnerId) : "all"}
          onValueChange={(value) =>
            value &&
            onFilterChange({
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
                {partner.brand_name || partner.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={gateway ?? "all"}
        onValueChange={(value) =>
          value &&
          onFilterChange({
            gateway: value === "all" ? null : value,
            page: null,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua gateway</SelectItem>
          {PAYMENT_GATEWAYS.map((item) => (
            <SelectItem key={item} value={item}>
              {gatewayLabels[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status ?? "all"}
        onValueChange={(value) =>
          value &&
          onFilterChange({
            status: value === "all" ? null : value,
            page: null,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          {PAYMENT_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {statusLabelsPayment[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        disabled={!filtered}
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  );
}
