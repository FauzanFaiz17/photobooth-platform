import { Ellipsis, Eye } from "lucide-react";
import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentRecord } from "@/features/payments/payment.types";
import { currency, formatDate } from "@/lib/utils";
import { gatewayLabels, statusLabelsPayment, statusVariants } from "@/constants";

export function TransactionTable({
  payments,
  superAdmin,
  onViewDetail,
  onTransition,
}: {
  readonly payments: ReadonlyArray<PaymentRecord>;
  readonly superAdmin: boolean;
  readonly onViewDetail: (payment: PaymentRecord) => void;
  readonly onTransition: (payment: PaymentRecord) => void;
}): ReactElement {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibayar</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-xs font-medium">
                {payment.reference}
              </TableCell>
              <TableCell>
                {gatewayLabels[payment.gateway]}
              </TableCell>
              <TableCell className="tabular-nums">
                {currency(payment.amount)}
              </TableCell>
              <TableCell className="tabular-nums">
                {currency(payment.fee)}
              </TableCell>
              <TableCell className="font-medium tabular-nums">
                {currency(payment.net_amount)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[payment.status]}>
                  {statusLabelsPayment[payment.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.paid_at
                  ? formatDate(payment.paid_at)
                  : "—"}
              </TableCell>
              <TableCell>
                {formatDate(payment.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Aksi ${payment.reference}`}
                      />
                    }
                  >
                    <Ellipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onViewDetail(payment)}
                    >
                      <Eye /> Lihat Detail
                    </DropdownMenuItem>
                    {superAdmin &&
                      payment.gateway !== "voucher" &&
                      (payment.status === "pending" ||
                        payment.status === "paid") && (
                        <DropdownMenuItem
                          onClick={() => onTransition(payment)}
                        >
                          Ubah Status
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
