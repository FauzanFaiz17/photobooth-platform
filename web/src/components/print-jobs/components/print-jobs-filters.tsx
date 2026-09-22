import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRINT_JOB_STATUSES, type PrintJobStatus } from "@/features/print-jobs/print-job.types";
import type { PartnerRecord } from "@/features/partners/partner.types";
import type { PrinterRecord } from "@/features/printers/printer.types";
import { labels } from "@/constants";

export function PrintJobsFilters({
  superAdmin,
  partnerId,
  printerId,
  status,
  filtered,
  partners,
  printers,
  onFilterChange,
  onReset,
}: {
  readonly superAdmin: boolean;
  readonly partnerId: number;
  readonly printerId: number;
  readonly status: PrintJobStatus | undefined;
  readonly filtered: boolean;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly printers: ReadonlyArray<PrinterRecord>;
  readonly onFilterChange: (updates: Record<string, string | null>) => void;
  readonly onReset: () => void;
}): ReactElement {
  return (
    <Card>
      <CardHeader className="gap-4 border-b">
        <div>
          <CardTitle>Antrean Cetak</CardTitle>
          <CardDescription>
            Filter diproses oleh backend. Pembuatan manual ditunda sampai
            Photo Session dapat dipilih dari dashboard.
          </CardDescription>
        </div>
        <div
          className={`grid gap-3 ${superAdmin ? "lg:grid-cols-[repeat(3,minmax(12rem,1fr))_auto]" : "lg:grid-cols-[repeat(2,minmax(12rem,1fr))_auto]"}`}
        >
          {superAdmin && (
            <Select
              value={partnerId ? String(partnerId) : "all"}
              onValueChange={(value) =>
                value &&
                onFilterChange({
                  partner_id: value === "all" ? null : value,
                  printer_id: null,
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
            value={printerId ? String(printerId) : "all"}
            onValueChange={(value) =>
              value &&
              onFilterChange({
                printer_id: value === "all" ? null : value,
                page: null,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Printer</SelectItem>
              {printers.map((printer) => (
                <SelectItem key={printer.id} value={String(printer.id)}>
                  {printer.name}
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
              <SelectItem value="all">Semua Status</SelectItem>
              {PRINT_JOB_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {labels[item]}
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
      </CardHeader>
    </Card>
  );
}
