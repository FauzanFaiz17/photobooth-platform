import type {
  PaymentMethod,
  PaymentStatus,
  Transaction,
  TransactionActivity,
  TransactionFilters,
  TransactionKiosk,
  TransactionStatus,
  TransactionSummary,
} from "../types/transaction.types"

export const transactionKiosks = [
  { id: "KSK-001", name: "Kiosk Garut Kota", location: "Garut Kota" },
  { id: "KSK-002", name: "Kiosk Tarogong", location: "Tarogong Kidul" },
  { id: "KSK-003", name: "Kiosk Bandung", location: "Bandung Wetan" },
  { id: "KSK-004", name: "Kiosk Tasikmalaya", location: "Cihideung" },
  { id: "KSK-005", name: "Kiosk Cianjur", location: "Cianjur Kota" },
] satisfies ReadonlyArray<TransactionKiosk>

export const transactionPackages = [
  { id: "package-classic", name: "Classic Session", price: 25_000 },
  { id: "package-premium", name: "Premium Session", price: 50_000 },
  { id: "package-celebration", name: "Celebration Session", price: 75_000 },
  { id: "package-event", name: "Event Session", price: 100_000 },
] as const

export const defaultTransactionFilters = {
  query: "",
  datePeriod: "30-days",
  customFrom: "2026-07-01",
  customTo: "2026-07-15",
  transactionStatus: "all",
  paymentStatus: "all",
  paymentMethod: "all",
  kioskId: "all",
} satisfies TransactionFilters

export const transactionSummary = {
  grossRevenue: 18_750_000,
  grossRevenueChange: 12.5,
  successfulTransactions: 1_184,
  successfulTransactionsChange: 8.2,
  pendingPayments: 24,
  pendingPaymentsChange: -5.4,
  refundedAmount: 425_000,
  refundCount: 11,
} satisfies TransactionSummary

interface TransactionSeed {
  readonly id: string
  readonly receiptNumber: string
  readonly createdAt: string
  readonly customerName: string
  readonly email: string
  readonly phone: string
  readonly kioskIndex: number
  readonly packageName: string
  readonly packagePrice: number
  readonly addOnName?: string
  readonly addOnPrice?: number
  readonly discount?: number
  readonly tax?: number
  readonly paymentMethod: PaymentMethod
  readonly paymentStatus: PaymentStatus
  readonly transactionStatus: TransactionStatus
  readonly refundedAmount?: number
}

function createActivities(seed: TransactionSeed, total: number): ReadonlyArray<TransactionActivity> {
  const activities: TransactionActivity[] = [
    { id: `${seed.id}-created`, type: "created", title: "Transaction created", description: `${seed.receiptNumber} was created for ${seed.customerName}.`, occurredAt: seed.createdAt },
    { id: `${seed.id}-payment`, type: "payment_initiated", title: "Payment initiated", description: `Payment of Rp${total.toLocaleString("id-ID")} was initiated.`, occurredAt: seed.createdAt },
  ]

  if (seed.paymentStatus === "paid" || seed.paymentStatus === "partially_refunded" || seed.paymentStatus === "refunded") {
    activities.push({ id: `${seed.id}-confirmed`, type: "payment_confirmed", title: "Payment confirmed", description: "The payment provider confirmed the transaction.", occurredAt: seed.createdAt })
  }
  if (seed.transactionStatus === "completed" || seed.transactionStatus === "refunded") {
    activities.push({ id: `${seed.id}-completed`, type: "session_completed", title: "Session completed", description: "The photobooth session completed successfully.", occurredAt: seed.createdAt })
  }
  if ((seed.refundedAmount ?? 0) > 0) {
    activities.push(
      { id: `${seed.id}-refund-requested`, type: "refund_requested", title: "Refund requested", description: "A refund was requested by operations.", occurredAt: seed.createdAt },
      { id: `${seed.id}-refund-completed`, type: "refund_completed", title: "Refund completed", description: `Rp${(seed.refundedAmount ?? 0).toLocaleString("id-ID")} was refunded.`, occurredAt: seed.createdAt }
    )
  }
  if (seed.transactionStatus === "cancelled") activities.push({ id: `${seed.id}-cancelled`, type: "cancelled", title: "Transaction cancelled", description: "The transaction was cancelled before completion.", occurredAt: seed.createdAt })
  if (seed.transactionStatus === "failed") activities.push({ id: `${seed.id}-failed`, type: "failed", title: "Transaction failed", description: "Payment could not be completed.", occurredAt: seed.createdAt })
  return activities
}

function createTransaction(seed: TransactionSeed): Transaction {
  const items = [
    { id: `${seed.id}-package`, name: seed.packageName, category: "package" as const, quantity: 1, unitPrice: seed.packagePrice },
    ...(seed.addOnName && seed.addOnPrice ? [{ id: `${seed.id}-addon`, name: seed.addOnName, category: "add-on" as const, quantity: 1, unitPrice: seed.addOnPrice }] : []),
  ]
  const subtotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  const discount = seed.discount ?? 0
  const tax = seed.tax ?? 0
  const total = subtotal - discount + tax
  const refundedAmount = seed.refundedAmount ?? 0
  const isPaid = seed.paymentStatus === "paid" || seed.paymentStatus === "partially_refunded" || seed.paymentStatus === "refunded"

  return {
    id: seed.id,
    receiptNumber: seed.receiptNumber,
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
    customer: { name: seed.customerName, email: seed.email, phone: seed.phone },
    kiosk: transactionKiosks[seed.kioskIndex],
    items,
    subtotal,
    discount,
    tax,
    total,
    paidAmount: isPaid ? total : 0,
    refundedAmount,
    paymentMethod: seed.paymentMethod,
    paymentStatus: seed.paymentStatus,
    transactionStatus: seed.transactionStatus,
    paymentReference: seed.paymentMethod === "cash" ? null : `PAY-${seed.id.slice(-3)}-2607`,
    paidAt: isPaid ? seed.createdAt : null,
    refund: refundedAmount > 0 ? { type: refundedAmount >= total ? "full" : "partial", amount: refundedAmount, reason: "customer_request", internalNote: "Dummy refund processed by operations.", refundedAt: seed.createdAt } : null,
    activities: createActivities(seed, total),
  }
}

const transactionSeeds = [
  { id: "TRX-20260715-001", receiptNumber: "INV-PL-260715-001", createdAt: "2026-07-15T22:41:00+07:00", customerName: "Alya Putri", email: "alya.putri@example.com", phone: "+62 812-1000-0001", kioskIndex: 0, packageName: "Premium Session", packagePrice: 50_000, addOnName: "Extra Print", addOnPrice: 15_000, paymentMethod: "qris", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260715-002", receiptNumber: "INV-PL-260715-002", createdAt: "2026-07-15T21:18:00+07:00", customerName: "Rafi Maulana", email: "rafi.maulana@example.com", phone: "+62 812-1000-0002", kioskIndex: 1, packageName: "Classic Session", packagePrice: 25_000, paymentMethod: "bank_transfer", paymentStatus: "pending", transactionStatus: "processing" },
  { id: "TRX-20260715-003", receiptNumber: "INV-PL-260715-003", createdAt: "2026-07-15T19:32:00+07:00", customerName: "Nadya Sari", email: "nadya.sari@example.com", phone: "+62 812-1000-0003", kioskIndex: 2, packageName: "Celebration Session", packagePrice: 75_000, paymentMethod: "cash", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260714-001", receiptNumber: "INV-PL-260714-001", createdAt: "2026-07-14T20:24:00+07:00", customerName: "Raka Pratama", email: "raka.pratama@example.com", phone: "+62 812-1000-0004", kioskIndex: 0, packageName: "Event Session", packagePrice: 100_000, paymentMethod: "credit_card", paymentStatus: "refunded", transactionStatus: "refunded", refundedAmount: 100_000 },
  { id: "TRX-20260714-002", receiptNumber: "INV-PL-260714-002", createdAt: "2026-07-14T17:10:00+07:00", customerName: "Keisha Ananda", email: "keisha.ananda@example.com", phone: "+62 812-1000-0005", kioskIndex: 3, packageName: "Classic Session", packagePrice: 25_000, paymentMethod: "cash", paymentStatus: "pending", transactionStatus: "cancelled" },
  { id: "TRX-20260713-018", receiptNumber: "INV-PL-260713-018", createdAt: "2026-07-13T18:54:00+07:00", customerName: "Dimas Ardi", email: "dimas.ardi@example.com", phone: "+62 812-1000-0006", kioskIndex: 4, packageName: "Premium Session", packagePrice: 50_000, paymentMethod: "e_wallet", paymentStatus: "failed", transactionStatus: "failed" },
  { id: "TRX-20260712-011", receiptNumber: "INV-PL-260712-011", createdAt: "2026-07-12T16:40:00+07:00", customerName: "Intan Permata", email: "intan.permata@example.com", phone: "+62 812-1000-0007", kioskIndex: 1, packageName: "Event Session", packagePrice: 100_000, paymentMethod: "debit_card", paymentStatus: "partially_refunded", transactionStatus: "completed", refundedAmount: 40_000 },
  { id: "TRX-20260711-009", receiptNumber: "INV-PL-260711-009", createdAt: "2026-07-11T14:28:00+07:00", customerName: "Fajar Nugraha", email: "fajar.nugraha@example.com", phone: "+62 812-1000-0008", kioskIndex: 2, packageName: "Celebration Session", packagePrice: 75_000, discount: 5_000, tax: 7_000, paymentMethod: "bank_transfer", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260710-012", receiptNumber: "INV-PL-260710-012", createdAt: "2026-07-10T20:15:00+07:00", customerName: "Lina Marlina", email: "lina.marlina@example.com", phone: "+62 812-1000-0009", kioskIndex: 0, packageName: "Classic Session", packagePrice: 25_000, paymentMethod: "qris", paymentStatus: "pending", transactionStatus: "processing" },
  { id: "TRX-20260709-004", receiptNumber: "INV-PL-260709-004", createdAt: "2026-07-09T13:37:00+07:00", customerName: "Yusuf Hakim", email: "yusuf.hakim@example.com", phone: "+62 812-1000-0010", kioskIndex: 3, packageName: "Premium Session", packagePrice: 50_000, addOnName: "Digital Copy", addOnPrice: 10_000, paymentMethod: "credit_card", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260708-007", receiptNumber: "INV-PL-260708-007", createdAt: "2026-07-08T12:22:00+07:00", customerName: "Sarah Aulia", email: "sarah.aulia@example.com", phone: "+62 812-1000-0011", kioskIndex: 4, packageName: "Classic Session", packagePrice: 25_000, paymentMethod: "qris", paymentStatus: "failed", transactionStatus: "cancelled" },
  { id: "TRX-20260707-015", receiptNumber: "INV-PL-260707-015", createdAt: "2026-07-07T18:49:00+07:00", customerName: "Bima Saputra", email: "bima.saputra@example.com", phone: "+62 812-1000-0012", kioskIndex: 1, packageName: "Celebration Session", packagePrice: 75_000, paymentMethod: "cash", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260706-006", receiptNumber: "INV-PL-260706-006", createdAt: "2026-07-06T15:31:00+07:00", customerName: "Citra Lestari", email: "citra.lestari@example.com", phone: "+62 812-1000-0013", kioskIndex: 2, packageName: "Premium Session", packagePrice: 50_000, paymentMethod: "qris", paymentStatus: "refunded", transactionStatus: "refunded", refundedAmount: 50_000 },
  { id: "TRX-20260705-021", receiptNumber: "INV-PL-260705-021", createdAt: "2026-07-05T21:06:00+07:00", customerName: "Galih Ramadhan", email: "galih.ramadhan@example.com", phone: "+62 812-1000-0014", kioskIndex: 0, packageName: "Event Session", packagePrice: 100_000, paymentMethod: "e_wallet", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260703-010", receiptNumber: "INV-PL-260703-010", createdAt: "2026-07-03T11:54:00+07:00", customerName: "Maya Puspita", email: "maya.puspita@example.com", phone: "+62 812-1000-0015", kioskIndex: 3, packageName: "Classic Session", packagePrice: 25_000, paymentMethod: "debit_card", paymentStatus: "paid", transactionStatus: "processing" },
  { id: "TRX-20260701-008", receiptNumber: "INV-PL-260701-008", createdAt: "2026-07-01T10:45:00+07:00", customerName: "Tegar Wibowo", email: "tegar.wibowo@example.com", phone: "+62 812-1000-0016", kioskIndex: 4, packageName: "Premium Session", packagePrice: 50_000, paymentMethod: "bank_transfer", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260628-014", receiptNumber: "INV-PL-260628-014", createdAt: "2026-06-28T17:16:00+07:00", customerName: "Dewi Anggraini", email: "dewi.anggraini@example.com", phone: "+62 812-1000-0017", kioskIndex: 0, packageName: "Celebration Session", packagePrice: 75_000, paymentMethod: "credit_card", paymentStatus: "failed", transactionStatus: "failed" },
  { id: "TRX-20260620-005", receiptNumber: "INV-PL-260620-005", createdAt: "2026-06-20T16:03:00+07:00", customerName: "Arman Setiawan", email: "arman.setiawan@example.com", phone: "+62 812-1000-0018", kioskIndex: 1, packageName: "Classic Session", packagePrice: 25_000, addOnName: "Extra Print", addOnPrice: 15_000, paymentMethod: "cash", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260518-009", receiptNumber: "INV-PL-260518-009", createdAt: "2026-05-18T14:39:00+07:00", customerName: "Nisa Rahma", email: "nisa.rahma@example.com", phone: "+62 812-1000-0019", kioskIndex: 2, packageName: "Event Session", packagePrice: 100_000, paymentMethod: "qris", paymentStatus: "paid", transactionStatus: "completed" },
  { id: "TRX-20260429-003", receiptNumber: "INV-PL-260429-003", createdAt: "2026-04-29T09:28:00+07:00", customerName: "Reza Firmansyah", email: "reza.firmansyah@example.com", phone: "+62 812-1000-0020", kioskIndex: 4, packageName: "Premium Session", packagePrice: 50_000, paymentMethod: "e_wallet", paymentStatus: "partially_refunded", transactionStatus: "completed", refundedAmount: 20_000 },
] satisfies ReadonlyArray<TransactionSeed>

export const initialTransactions = transactionSeeds.map(createTransaction) satisfies ReadonlyArray<Transaction>

