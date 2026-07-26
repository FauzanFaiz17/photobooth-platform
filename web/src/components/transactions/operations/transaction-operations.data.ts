import type {
  PhotoboothKioskOption,
  PhotoboothTransaction,
  PhotoboothTransactionFilters,
} from "./transaction-operations.types"

export const photoboothKiosks: ReadonlyArray<PhotoboothKioskOption> = [
  { id: "KSK-AMEHO", name: "AMEHO" },
  { id: "KSK-001", name: "Main Studio Booth" },
  { id: "KSK-002", name: "Booth Sudirman" },
  { id: "KSK-003", name: "Booth Kemang" },
  { id: "KSK-004", name: "Booth Senayan" },
  { id: "KSK-005", name: "Booth Blok M" },
]

export const defaultPhotoboothTransactionFilters: PhotoboothTransactionFilters = {
  query: "",
  dateFrom: "2026-07-01",
  dateTo: "2026-07-17",
  kioskId: "all",
  status: "all",
  sessionMode: "all",
  paymentMethod: "all",
}

export const photoboothTransactions: ReadonlyArray<PhotoboothTransaction> = [
  { id: "TRX-260717-0198", occurredAt: "2026-07-17T21:42:00+07:00", kiosk: photoboothKiosks[0], sessionId: "SES-260717-048", sessionMode: "paid", paymentMethod: "qris", amount: 75_000, status: "success", paymentReference: "QRIS-987411204", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260717-0197", occurredAt: "2026-07-17T21:18:00+07:00", kiosk: photoboothKiosks[1], sessionId: "SES-260717-047", sessionMode: "voucher", paymentMethod: "none", amount: 0, status: "voucher", paymentReference: null, paymentGateway: null, voucherCode: "KOLASEJULI" },
  { id: "TRX-260717-0196", occurredAt: "2026-07-17T20:51:00+07:00", kiosk: photoboothKiosks[2], sessionId: "SES-260717-046", sessionMode: "paid", paymentMethod: "e-wallet", amount: 50_000, status: "pending", paymentReference: "GOPAY-4268193", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260717-0195", occurredAt: "2026-07-17T20:20:00+07:00", kiosk: photoboothKiosks[3], sessionId: "SES-260717-045", sessionMode: "free", paymentMethod: "none", amount: 0, status: "free", paymentReference: null, paymentGateway: null, voucherCode: null },
  { id: "TRX-260717-0194", occurredAt: "2026-07-17T19:56:00+07:00", kiosk: photoboothKiosks[4], sessionId: "SES-260717-044", sessionMode: "paid", paymentMethod: "debit-card", amount: 100_000, status: "success", paymentReference: "CARD-11208741", paymentGateway: "Xendit", voucherCode: null },
  { id: "TRX-260717-0193", occurredAt: "2026-07-17T19:22:00+07:00", kiosk: photoboothKiosks[5], sessionId: "SES-260717-043", sessionMode: "paid", paymentMethod: "qris", amount: 35_000, status: "failed", paymentReference: "QRIS-987410992", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260717-0192", occurredAt: "2026-07-17T18:40:00+07:00", kiosk: photoboothKiosks[0], sessionId: "SES-260717-042", sessionMode: "paid", paymentMethod: "bank-transfer", amount: 75_000, status: "expired", paymentReference: "VA-7702198401", paymentGateway: "Xendit", voucherCode: null },
  { id: "TRX-260717-0191", occurredAt: "2026-07-17T18:05:00+07:00", kiosk: photoboothKiosks[1], sessionId: "SES-260717-041", sessionMode: "voucher", paymentMethod: "none", amount: 0, status: "voucher", paymentReference: null, paymentGateway: null, voucherCode: "STUDIO25" },
  { id: "TRX-260716-0190", occurredAt: "2026-07-16T22:14:00+07:00", kiosk: photoboothKiosks[2], sessionId: "SES-260716-040", sessionMode: "paid", paymentMethod: "credit-card", amount: 125_000, status: "success", paymentReference: "CARD-11207913", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260716-0189", occurredAt: "2026-07-16T21:33:00+07:00", kiosk: photoboothKiosks[3], sessionId: "SES-260716-039", sessionMode: "paid", paymentMethod: "cash", amount: 50_000, status: "success", paymentReference: "CASH-KMG-039", paymentGateway: "Kiosk Cashier", voucherCode: null },
  { id: "TRX-260716-0188", occurredAt: "2026-07-16T20:12:00+07:00", kiosk: photoboothKiosks[4], sessionId: "SES-260716-038", sessionMode: "free", paymentMethod: "none", amount: 0, status: "free", paymentReference: null, paymentGateway: null, voucherCode: null },
  { id: "TRX-260715-0187", occurredAt: "2026-07-15T19:48:00+07:00", kiosk: photoboothKiosks[5], sessionId: "SES-260715-037", sessionMode: "paid", paymentMethod: "qris", amount: 35_000, status: "success", paymentReference: "QRIS-987398119", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260714-0186", occurredAt: "2026-07-14T18:21:00+07:00", kiosk: photoboothKiosks[0], sessionId: "SES-260714-036", sessionMode: "voucher", paymentMethod: "none", amount: 0, status: "voucher", paymentReference: null, paymentGateway: null, voucherCode: "AMEHO10" },
  { id: "TRX-260713-0185", occurredAt: "2026-07-13T17:39:00+07:00", kiosk: photoboothKiosks[1], sessionId: "SES-260713-035", sessionMode: "paid", paymentMethod: "e-wallet", amount: 75_000, status: "failed", paymentReference: "OVO-4261021", paymentGateway: "Xendit", voucherCode: null },
  { id: "TRX-260712-0184", occurredAt: "2026-07-12T16:55:00+07:00", kiosk: photoboothKiosks[2], sessionId: "SES-260712-034", sessionMode: "paid", paymentMethod: "qris", amount: 50_000, status: "success", paymentReference: "QRIS-987201774", paymentGateway: "Midtrans", voucherCode: null },
  { id: "TRX-260711-0183", occurredAt: "2026-07-11T15:26:00+07:00", kiosk: photoboothKiosks[3], sessionId: "SES-260711-033", sessionMode: "paid", paymentMethod: "bank-transfer", amount: 100_000, status: "pending", paymentReference: "VA-7701182340", paymentGateway: "Xendit", voucherCode: null },
  { id: "TRX-260710-0182", occurredAt: "2026-07-10T14:10:00+07:00", kiosk: photoboothKiosks[4], sessionId: "SES-260710-032", sessionMode: "free", paymentMethod: "none", amount: 0, status: "free", paymentReference: null, paymentGateway: null, voucherCode: null },
  { id: "TRX-260709-0181", occurredAt: "2026-07-09T13:42:00+07:00", kiosk: photoboothKiosks[5], sessionId: "SES-260709-031", sessionMode: "paid", paymentMethod: "qris", amount: 35_000, status: "success", paymentReference: "QRIS-986994312", paymentGateway: "Midtrans", voucherCode: null },
]
