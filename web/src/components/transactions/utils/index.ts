import { gatewayLabels, statusLabelsPayment } from "@/constants";
import type { PaymentRecord } from "@/features/payments/payment.types";

export function exportPayments(payments: ReadonlyArray<PaymentRecord>): void {
  const rows = [
    [
      "Reference",
      "Gateway",
      "Status",
      "Amount",
      "Fee",
      "Net Amount",
      "Paid At",
      "Created At",
    ],
    ...payments.map((payment) => [
      payment.reference,
      gatewayLabels[payment.gateway],
      statusLabelsPayment[payment.status],
      String(payment.amount),
      String(payment.fee),
      String(payment.net_amount),
      payment.paid_at ?? "",
      payment.created_at,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "payments-kolase.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
