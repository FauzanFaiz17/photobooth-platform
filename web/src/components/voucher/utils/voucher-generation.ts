import { voucherReferenceTime } from "../data/voucher-data"
import type { Voucher, VoucherBenefit, VoucherGenerateFormValues, VoucherRedemption, VoucherValidationInput } from "../types/voucher.types"

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function parsePositiveNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function createRandomCharacters(length: number, fallbackSeed: number): string {
  const values = new Uint32Array(length)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values)
  else for (let index = 0; index < length; index += 1) values[index] = (fallbackSeed + index * 17) * 31
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("")
}

export function normalizeVoucherPrefix(prefix: string): string {
  return prefix.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
}

export function isVoucherCodeFormatValid(code: string): boolean {
  return /^[A-HJ-KM-NP-Z2-9_-]+$/.test(code)
}

export function generateUniqueVoucherCode(prefix: string, length: 8 | 10 | 12, existingCodes: ReadonlySet<string>, seed: number): string {
  const normalizedPrefix = normalizeVoucherPrefix(prefix)
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = createRandomCharacters(length, seed + attempt)
    const code = normalizedPrefix ? `${normalizedPrefix}-${suffix}` : suffix
    if (!existingCodes.has(code)) return code
  }
  throw new Error("Unable to create a unique voucher code.")
}

function createBenefit(values: VoucherGenerateFormValues): VoucherBenefit {
  switch (values.benefitType) {
    case "free_session": return { type: "free_session", maximumCoveredAmount: values.maximumCoveredAmount ? parsePositiveNumber(values.maximumCoveredAmount, 50_000) : null }
    case "fixed_credit": return { type: "fixed_credit", amount: parsePositiveNumber(values.creditAmount, 50_000) }
    case "percentage_discount": return { type: "percentage_discount", percentage: Math.min(100, parsePositiveNumber(values.discountPercentage, 10)), maximumDiscountAmount: values.maximumDiscountAmount ? parsePositiveNumber(values.maximumDiscountAmount, 25_000) : null }
    case "fixed_discount": return { type: "fixed_discount", amount: parsePositiveNumber(values.fixedDiscountAmount, 20_000), minimumTransactionAmount: values.minimumTransactionAmount ? parsePositiveNumber(values.minimumTransactionAmount, 50_000) : null }
  }
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString()
}

export function generateVouchers(values: VoucherGenerateFormValues, currentVouchers: ReadonlyArray<Voucher>): ReadonlyArray<Voucher> {
  /* Production voucher codes must be created server-side, stored in a database, validated by the backend, and redeemed atomically. The desktop client must never be the source of truth or log sensitive codes indiscriminately. */
  const quantity = values.mode === "single" ? 1 : Math.min(500, Math.max(2, Number(values.quantity) || 2))
  const codes = new Set(currentVouchers.map((voucher) => voucher.code))
  const startsAt = combineDateTime(values.startDate, values.startTime)
  const expiresAt = values.noExpiration ? null : combineDateTime(values.expirationDate, values.expirationTime)
  const now = new Date(voucherReferenceTime)
  const batchId = quantity > 1 ? `BATCH-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${currentVouchers.length + 1}` : null
  const storedStatus = values.initialStatus === "disabled" ? "disabled" : "enabled"
  const maximumRedemptions = Math.max(1, Number(values.maximumRedemptions) || 1)
  return Array.from({ length: quantity }, (_, index) => {
    const custom = values.mode === "single" ? values.customCode.trim().toUpperCase() : ""
    const code = custom || generateUniqueVoucherCode(values.prefix, values.codeLength, codes, currentVouchers.length + index + 1)
    if (codes.has(code)) throw new Error("Voucher code must be unique.")
    if (!isVoucherCodeFormatValid(code)) throw new Error("Voucher code format is invalid.")
    codes.add(code)
    return {
      id: `voucher-generated-${now.getTime()}-${index + 1}`,
      code,
      name: values.name.trim(),
      description: values.description.trim(),
      prefix: normalizeVoucherPrefix(values.prefix) || null,
      batchId,
      benefit: createBenefit(values),
      storedStatus,
      startsAt,
      expiresAt,
      maximumRedemptions,
      redemptionCount: 0,
      maximumRedemptionsPerCustomer: values.maximumRedemptionsPerCustomer ? Math.max(1, Number(values.maximumRedemptionsPerCustomer)) : null,
      oneRedemptionPerSession: values.oneRedemptionPerSession,
      allowMultipleUses: values.allowMultipleUses,
      requireCustomerIdentifier: values.requireCustomerIdentifier,
      applicableKioskIds: values.kioskScope === "all" ? "all" : [...values.kioskIds],
      applicablePackageIds: values.packageScope === "all" ? "all" : [...values.packageIds],
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      internalNote: values.internalNote.trim(),
      createdAt: voucherReferenceTime,
      updatedAt: voucherReferenceTime,
      createdBy: "Admin PhotoLab",
      redemptions: [],
    } satisfies Voucher
  })
}

export function duplicateVoucherConfiguration(voucher: Voucher, existingVouchers: ReadonlyArray<Voucher>): Voucher {
  const code = generateUniqueVoucherCode(voucher.prefix ?? "COPY", 8, new Set(existingVouchers.map((item) => item.code)), existingVouchers.length + 101)
  return { ...voucher, id: `voucher-copy-${Date.now()}`, code, name: `${voucher.name} Copy`, batchId: null, storedStatus: "enabled", redemptionCount: 0, redemptions: [], createdAt: voucherReferenceTime, updatedAt: voucherReferenceTime }
}

export function redeemVoucher(voucher: Voucher, input: VoucherValidationInput): Voucher {
  const redemption: VoucherRedemption = {
    id: `${voucher.id}-redemption-${voucher.redemptions.length + 1}`,
    occurredAt: voucherReferenceTime,
    kioskId: input.kioskId,
    sessionId: `SES-VOUCHER-${String(voucher.redemptions.length + 1).padStart(3, "0")}`,
    customerReference: input.customerIdentifier.trim() || "WALK-IN",
    result: "redeemed",
    value: voucher.benefit.type === "free_session" ? voucher.benefit.maximumCoveredAmount ?? 50_000 : voucher.benefit.type === "fixed_credit" ? voucher.benefit.amount : voucher.benefit.type === "fixed_discount" ? voucher.benefit.amount : voucher.benefit.maximumDiscountAmount ?? 25_000,
    notes: "Voucher accepted by the validation simulator.",
  }
  return { ...voucher, redemptionCount: voucher.redemptionCount + 1, updatedAt: voucherReferenceTime, redemptions: [...voucher.redemptions, redemption] }
}
