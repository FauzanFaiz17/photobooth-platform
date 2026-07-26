import { transactionKiosks, transactionPackages } from "@/components/transactions/data/transactions-data"
import type { Voucher, VoucherBenefit, VoucherFilters, VoucherRedemption, VoucherStoredStatus, VoucherSummary } from "../types/voucher.types"

export const voucherKiosks = transactionKiosks
export const voucherPackages = transactionPackages
export const voucherReferenceTime = "2026-07-15T23:00:00+07:00"

export const defaultVoucherFilters = {
  query: "",
  status: "all",
  benefit: "all",
  kioskId: "all",
  expiration: "all",
  sort: "newest",
} satisfies VoucherFilters

export const voucherSummary = {
  activeVouchers: 428,
  generatedThisMonth: 36,
  redeemedVouchers: 1_284,
  redemptionRate: 72.4,
  expiringSoon: 38,
  voucherSessions: 1_196,
  equivalentValue: 17_940_000,
} satisfies VoucherSummary

interface VoucherSeed {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly description: string
  readonly prefix: string | null
  readonly batchId: string | null
  readonly benefit: VoucherBenefit
  readonly storedStatus: VoucherStoredStatus
  readonly startsAt: string
  readonly expiresAt: string | null
  readonly maximumRedemptions: number
  readonly redemptionCount: number
  readonly kioskIds: ReadonlyArray<string> | "all"
  readonly packageIds: ReadonlyArray<string> | "all"
  readonly tags: ReadonlyArray<string>
  readonly createdAt: string
  readonly includeRejected?: boolean
}

function getRedemptionValue(benefit: VoucherBenefit): number {
  switch (benefit.type) {
    case "free_session": return benefit.maximumCoveredAmount ?? 50_000
    case "fixed_credit": return benefit.amount
    case "percentage_discount": return benefit.maximumDiscountAmount ?? 25_000
    case "fixed_discount": return benefit.amount
  }
}

function createRedemptions(seed: VoucherSeed): ReadonlyArray<VoucherRedemption> {
  const kioskId = seed.kioskIds === "all" ? voucherKiosks[0].id : seed.kioskIds[0] ?? voucherKiosks[0].id
  const successful = Array.from({ length: seed.redemptionCount }, (_, index) => ({
    id: `${seed.id}-redemption-${index + 1}`,
    occurredAt: `2026-07-${String(14 - Math.min(index, 8)).padStart(2, "0")}T${String(18 - (index % 4)).padStart(2, "0")}:20:00+07:00`,
    kioskId,
    sessionId: `SES-202607${String(14 - Math.min(index, 8)).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`,
    customerReference: `CUST-${seed.id.slice(-3)}-${index + 1}`,
    result: "redeemed" as const,
    value: getRedemptionValue(seed.benefit),
    notes: "Voucher accepted and session started.",
  }))
  if (!seed.includeRejected) return successful
  return [...successful, { id: `${seed.id}-rejected-1`, occurredAt: "2026-07-15T12:10:00+07:00", kioskId: voucherKiosks[4].id, sessionId: `SES-REJECT-${seed.id.slice(-3)}`, customerReference: `CUST-REJECT-${seed.id.slice(-3)}`, result: "rejected", value: 0, notes: "Invalid kiosk" }]
}

function createVoucher(seed: VoucherSeed): Voucher {
  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    description: seed.description,
    prefix: seed.prefix,
    batchId: seed.batchId,
    benefit: seed.benefit,
    storedStatus: seed.storedStatus,
    startsAt: seed.startsAt,
    expiresAt: seed.expiresAt,
    maximumRedemptions: seed.maximumRedemptions,
    redemptionCount: seed.redemptionCount,
    maximumRedemptionsPerCustomer: 1,
    oneRedemptionPerSession: true,
    allowMultipleUses: seed.maximumRedemptions > 1,
    requireCustomerIdentifier: seed.maximumRedemptions > 1,
    applicableKioskIds: seed.kioskIds,
    applicablePackageIds: seed.packageIds,
    tags: seed.tags,
    internalNote: "Dummy voucher configuration for dashboard preview.",
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
    createdBy: "Admin PhotoLab",
    redemptions: createRedemptions(seed),
  }
}

const voucherSeeds = [
  { id: "voucher-001", code: "UNIGA-7K9M2P4X", name: "Graduation Promo July", description: "Free graduation session for partner students.", prefix: "UNIGA", batchId: null, benefit: { type: "free_session", maximumCoveredAmount: 75_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-07-31T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001"], packageIds: ["package-celebration"], tags: ["graduation", "partner"], createdAt: "2026-07-15T10:00:00+07:00" },
  { id: "voucher-002", code: "GARUT-X8RT4Q2B", name: "Free Session Garut", description: "Customer acquisition credit for Garut kiosks.", prefix: "GARUT", batchId: null, benefit: { type: "fixed_credit", amount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-15T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["garut", "acquisition"], createdAt: "2026-07-14T10:00:00+07:00", includeRejected: true },
  { id: "voucher-003", code: "PHOTO-9WK3DM7N", name: "Photo Club Discount", description: "Reusable discount for community members.", prefix: "PHOTO", batchId: null, benefit: { type: "percentage_discount", percentage: 25, maximumDiscountAmount: 30_000 }, storedStatus: "enabled", startsAt: "2026-06-15T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 5, redemptionCount: 2, kioskIds: "all", packageIds: "all", tags: ["community", "discount"], createdAt: "2026-07-13T10:00:00+07:00" },
  { id: "voucher-004", code: "EVENT-4MP7XQ8R", name: "Event Partner Voucher", description: "One-time event partner discount.", prefix: "EVENT", batchId: null, benefit: { type: "fixed_discount", amount: 20_000, minimumTransactionAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-07-30T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 1, kioskIds: "all", packageIds: ["package-event"], tags: ["event", "partner"], createdAt: "2026-07-12T10:00:00+07:00" },
  { id: "voucher-005", code: "VIP-8KT2WM9P", name: "VIP Compensation", description: "Compensation voucher disabled by operations.", prefix: "VIP", batchId: null, benefit: { type: "free_session", maximumCoveredAmount: 100_000 }, storedStatus: "disabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-31T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: "all", packageIds: "all", tags: ["vip", "compensation"], createdAt: "2026-07-11T10:00:00+07:00" },
  { id: "voucher-006", code: "WED-7RC3XK8M", name: "Wedding August Preview", description: "Scheduled wedding campaign.", prefix: "WED", batchId: null, benefit: { type: "percentage_discount", percentage: 20, maximumDiscountAmount: 40_000 }, storedStatus: "enabled", startsAt: "2026-08-01T00:00:00+07:00", expiresAt: "2026-08-31T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-003"], packageIds: ["package-event"], tags: ["wedding", "scheduled"], createdAt: "2026-07-10T10:00:00+07:00" },
  { id: "voucher-007", code: "CORP-6QW4TK8X", name: "Corporate June", description: "Expired corporate campaign.", prefix: "CORP", batchId: null, benefit: { type: "fixed_credit", amount: 75_000 }, storedStatus: "enabled", startsAt: "2026-06-01T00:00:00+07:00", expiresAt: "2026-06-30T23:59:00+07:00", maximumRedemptions: 3, redemptionCount: 1, kioskIds: ["KSK-003"], packageIds: ["package-event"], tags: ["corporate", "expired"], createdAt: "2026-07-09T10:00:00+07:00" },
  { id: "voucher-008", code: "GRAD-5PX7RK3M", name: "Graduation Week", description: "Expiring graduation voucher.", prefix: "GRAD", batchId: null, benefit: { type: "free_session", maximumCoveredAmount: 75_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-07-20T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001", "KSK-004"], packageIds: ["package-celebration"], tags: ["graduation", "expiring"], createdAt: "2026-07-08T10:00:00+07:00" },
  { id: "voucher-009", code: "BDAY-3XM8QK7T", name: "Birthday Multi Use", description: "Birthday credit usable five times.", prefix: "BDAY", batchId: null, benefit: { type: "fixed_credit", amount: 25_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-09-01T23:59:00+07:00", maximumRedemptions: 5, redemptionCount: 3, kioskIds: "all", packageIds: ["package-celebration"], tags: ["birthday", "multi-use"], createdAt: "2026-07-07T10:00:00+07:00" },
  { id: "voucher-010", code: "PARTNER-2KR8WX4Q", name: "Lifetime Partner Credit", description: "Partner voucher without expiration.", prefix: "PARTNER", batchId: null, benefit: { type: "fixed_discount", amount: 15_000, minimumTransactionAmount: null }, storedStatus: "enabled", startsAt: "2026-01-01T00:00:00+07:00", expiresAt: null, maximumRedemptions: 10, redemptionCount: 0, kioskIds: "all", packageIds: "all", tags: ["partner", "no-expiration"], createdAt: "2026-07-06T10:00:00+07:00" },
  { id: "voucher-011", code: "EVENT-7XM2KP8Q", name: "Campus Event Batch", description: "Campus event batch code.", prefix: "EVENT", batchId: "BATCH-260705-01", benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-05T00:00:00+07:00", expiresAt: "2026-07-22T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001"], packageIds: ["package-classic", "package-premium"], tags: ["campus", "batch"], createdAt: "2026-07-05T10:00:00+07:00" },
  { id: "voucher-012", code: "EVENT-4QK8MT7X", name: "Campus Event Batch", description: "Campus event batch code.", prefix: "EVENT", batchId: "BATCH-260705-01", benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-05T00:00:00+07:00", expiresAt: "2026-07-22T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 1, kioskIds: ["KSK-001"], packageIds: ["package-classic", "package-premium"], tags: ["campus", "batch"], createdAt: "2026-07-05T09:59:00+07:00" },
  { id: "voucher-013", code: "EVENT-9RT3WK6M", name: "Campus Event Batch", description: "Campus event batch code.", prefix: "EVENT", batchId: "BATCH-260705-01", benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "disabled", startsAt: "2026-07-05T00:00:00+07:00", expiresAt: "2026-07-22T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001"], packageIds: ["package-classic", "package-premium"], tags: ["campus", "batch"], createdAt: "2026-07-05T09:58:00+07:00" },
  { id: "voucher-014", code: "EVENT-6WX9PK3R", name: "Campus Event Batch", description: "Campus event batch code.", prefix: "EVENT", batchId: "BATCH-260705-01", benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-05T00:00:00+07:00", expiresAt: "2026-07-22T23:59:00+07:00", maximumRedemptions: 2, redemptionCount: 1, kioskIds: ["KSK-001"], packageIds: ["package-classic", "package-premium"], tags: ["campus", "batch"], createdAt: "2026-07-05T09:57:00+07:00" },
  { id: "voucher-015", code: "EVENT-8KM4XQ7T", name: "Campus Event Batch", description: "Campus event batch code.", prefix: "EVENT", batchId: "BATCH-260705-01", benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-05T00:00:00+07:00", expiresAt: "2026-07-22T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001"], packageIds: ["package-classic", "package-premium"], tags: ["campus", "batch"], createdAt: "2026-07-05T09:56:00+07:00" },
  { id: "voucher-016", code: "GARUT-7QX3MK8R", name: "Garut Community Batch", description: "Community appreciation batch.", prefix: "GARUT", batchId: "BATCH-260701-02", benefit: { type: "percentage_discount", percentage: 15, maximumDiscountAmount: 20_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["community", "batch"], createdAt: "2026-07-01T10:00:00+07:00" },
  { id: "voucher-017", code: "GARUT-4TK9WP6X", name: "Garut Community Batch", description: "Community appreciation batch.", prefix: "GARUT", batchId: "BATCH-260701-02", benefit: { type: "percentage_discount", percentage: 15, maximumDiscountAmount: 20_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 1, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["community", "batch"], createdAt: "2026-07-01T09:59:00+07:00" },
  { id: "voucher-018", code: "GARUT-8RM3KX7Q", name: "Garut Community Batch", description: "Community appreciation batch.", prefix: "GARUT", batchId: "BATCH-260701-02", benefit: { type: "percentage_discount", percentage: 15, maximumDiscountAmount: 20_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 3, redemptionCount: 1, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["community", "batch"], createdAt: "2026-07-01T09:58:00+07:00", includeRejected: true },
  { id: "voucher-019", code: "GARUT-5PX8QW4M", name: "Garut Community Batch", description: "Community appreciation batch.", prefix: "GARUT", batchId: "BATCH-260701-02", benefit: { type: "percentage_discount", percentage: 15, maximumDiscountAmount: 20_000 }, storedStatus: "disabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["community", "batch"], createdAt: "2026-07-01T09:57:00+07:00" },
  { id: "voucher-020", code: "GARUT-2WK7MT9X", name: "Garut Community Batch", description: "Community appreciation batch.", prefix: "GARUT", batchId: "BATCH-260701-02", benefit: { type: "percentage_discount", percentage: 15, maximumDiscountAmount: 20_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-08-01T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001", "KSK-002"], packageIds: "all", tags: ["community", "batch"], createdAt: "2026-07-01T09:56:00+07:00" },
  { id: "voucher-021", code: "JUNE-3KX8RQ7M", name: "June Loyalty", description: "Expired loyalty reward.", prefix: "JUNE", batchId: null, benefit: { type: "fixed_discount", amount: 10_000, minimumTransactionAmount: 25_000 }, storedStatus: "enabled", startsAt: "2026-06-01T00:00:00+07:00", expiresAt: "2026-07-01T23:59:00+07:00", maximumRedemptions: 2, redemptionCount: 0, kioskIds: "all", packageIds: "all", tags: ["loyalty", "expired"], createdAt: "2026-06-20T10:00:00+07:00" },
  { id: "voucher-022", code: "OPS-7MT4QX9R", name: "Operations Recovery", description: "Disabled operational recovery voucher.", prefix: "OPS", batchId: null, benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "disabled", startsAt: "2026-06-01T00:00:00+07:00", expiresAt: "2026-12-31T23:59:00+07:00", maximumRedemptions: 3, redemptionCount: 1, kioskIds: "all", packageIds: "all", tags: ["operations", "recovery"], createdAt: "2026-06-15T10:00:00+07:00" },
  { id: "voucher-023", code: "LOYAL-9XK3WP7M", name: "Loyal Customer Multi", description: "Fully redeemed loyalty credit.", prefix: "LOYAL", batchId: null, benefit: { type: "fixed_credit", amount: 25_000 }, storedStatus: "enabled", startsAt: "2026-05-01T00:00:00+07:00", expiresAt: "2026-12-31T23:59:00+07:00", maximumRedemptions: 3, redemptionCount: 3, kioskIds: "all", packageIds: "all", tags: ["loyalty", "multi-use"], createdAt: "2026-06-01T10:00:00+07:00" },
  { id: "voucher-024", code: "PHOTO-6RM8TQ4X", name: "Studio Welcome", description: "New customer studio discount.", prefix: "PHOTO", batchId: null, benefit: { type: "fixed_discount", amount: 20_000, minimumTransactionAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-07-01T00:00:00+07:00", expiresAt: "2026-09-30T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: ["KSK-001"], packageIds: "all", tags: ["welcome", "studio"], createdAt: "2026-05-20T10:00:00+07:00" },
  { id: "voucher-025", code: "AUGUST-4XK7PM9R", name: "August Launch", description: "Scheduled August campaign.", prefix: "AUGUST", batchId: null, benefit: { type: "free_session", maximumCoveredAmount: 50_000 }, storedStatus: "enabled", startsAt: "2026-08-01T00:00:00+07:00", expiresAt: "2026-08-15T23:59:00+07:00", maximumRedemptions: 1, redemptionCount: 0, kioskIds: "all", packageIds: ["package-classic"], tags: ["august", "launch"], createdAt: "2026-05-15T10:00:00+07:00" },
] satisfies ReadonlyArray<VoucherSeed>

export const initialVouchers = voucherSeeds.map(createVoucher) satisfies ReadonlyArray<Voucher>

