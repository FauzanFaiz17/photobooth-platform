import { transactionKiosks, transactionPackages } from "../data/transactions-data"
import type {
  CreateTransactionValues,
  RefundFormValues,
  Transaction,
  TransactionActivity,
} from "../types/transaction.types"

const UPDATE_TIME = "2026-07-15T23:00:00+07:00"

function createActivity(
  transactionId: string,
  suffix: string,
  type: TransactionActivity["type"],
  title: string,
  description: string
): TransactionActivity {
  return { id: `${transactionId}-${suffix}`, type, title, description, occurredAt: UPDATE_TIME }
}

export function createLocalTransaction(values: CreateTransactionValues, sequence: number): Transaction {
  const kiosk = transactionKiosks.find((item) => item.id === values.kioskId) ?? transactionKiosks[0]
  const selectedPackage = transactionPackages.find((item) => item.id === values.packageId) ?? transactionPackages[0]
  const total = Number(values.amount)
  const serial = String(sequence).padStart(3, "0")
  const id = `TRX-20260715-${serial}`
  const emailName = values.customerName.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  const items = [{ id: `${id}-package`, name: selectedPackage.name, category: "package" as const, quantity: 1, unitPrice: total }]

  return {
    id,
    receiptNumber: `INV-PL-260715-${serial}`,
    createdAt: UPDATE_TIME,
    updatedAt: UPDATE_TIME,
    customer: { name: values.customerName, email: `${emailName || "customer"}@example.com`, phone: "Not provided" },
    kiosk,
    items,
    subtotal: total,
    discount: 0,
    tax: 0,
    total,
    paidAmount: 0,
    refundedAmount: 0,
    paymentMethod: values.paymentMethod,
    paymentStatus: "pending",
    transactionStatus: "processing",
    paymentReference: values.paymentMethod === "cash" ? null : `PAY-${serial}-2607`,
    paidAt: null,
    refund: null,
    activities: [
      createActivity(id, "created", "created", "Transaction created", `${values.customerName}'s transaction was created locally.`),
      createActivity(id, "payment", "payment_initiated", "Payment initiated", "Payment is waiting for confirmation."),
    ],
  }
}

export function completeLocalTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    updatedAt: UPDATE_TIME,
    transactionStatus: "completed",
    activities: [...transaction.activities, createActivity(transaction.id, "completed-local", "session_completed", "Session completed", "The transaction was marked as completed by operations.")],
  }
}

export function cancelLocalTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    updatedAt: UPDATE_TIME,
    transactionStatus: "cancelled",
    activities: [...transaction.activities, createActivity(transaction.id, "cancelled-local", "cancelled", "Transaction cancelled", "The transaction was cancelled by operations.")],
  }
}

export function refundLocalTransaction(transaction: Transaction, values: RefundFormValues): Transaction {
  const amount = Number(values.amount)
  const refundedAmount = transaction.refundedAmount + amount
  const fullyRefunded = refundedAmount >= transaction.paidAmount

  return {
    ...transaction,
    updatedAt: UPDATE_TIME,
    refundedAmount,
    paymentStatus: fullyRefunded ? "refunded" : "partially_refunded",
    transactionStatus: fullyRefunded ? "refunded" : transaction.transactionStatus,
    refund: { type: fullyRefunded ? "full" : values.type, amount: refundedAmount, reason: values.reason, internalNote: values.internalNote, refundedAt: UPDATE_TIME },
    activities: [
      ...transaction.activities,
      createActivity(transaction.id, "refund-requested-local", "refund_requested", "Refund requested", `A refund of ${amount.toLocaleString("id-ID")} was requested.`),
      createActivity(transaction.id, "refund-completed-local", "refund_completed", "Refund completed", "The local refund simulation completed successfully."),
    ],
  }
}

