import { useEffect, useState } from "react"

import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import { getPayments } from "@/features/payments/payment-service"
import type { PaymentRecord } from "@/features/payments/payment.types"
import {
  buildPaymentCountRows,
  buildRevenueRows,
  normalizeDate,
  partnerValueKey,
  rankPartnersByRevenue,
  windowStart,
  type OverviewChartRow,
  type OverviewPeriod,
} from "@/features/reports/report-overview"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

export type { OverviewPeriod, OverviewChartRow }

export interface PartnerRankingPoint {
  readonly name: string
  readonly revenue: number
}

export interface PartnerToggleItem {
  readonly id: number
  readonly key: string
  readonly label: string
  readonly color: string
  readonly enabled: boolean
}

export interface PartnerSeries {
  readonly id: number
  readonly key: string
  readonly label: string
  readonly color: string
}

interface PartnerOption {
  readonly id: number
  readonly name: string
}

const PER_PAGE = 100
const MAX_PAGES = 15
const RANKING_SIZE = 8
const PARTNER_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

async function collectPayments(
  token: string,
  start: string,
  signal: AbortSignal
): Promise<ReadonlyArray<PaymentRecord>> {
  const collected: PaymentRecord[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getPayments(
      token,
      { status: "paid", sort: "paid_at", direction: "desc", per_page: PER_PAGE, page },
      signal
    )
    collected.push(...result.data)

    if (page >= result.meta.last_page || result.data.length === 0) break

    const oldest = normalizeDate(result.data[result.data.length - 1].paid_at)
    if (oldest && oldest < start) break
  }

  return collected.filter((payment) => {
    const date = normalizeDate(payment.paid_at)
    return date !== null && date >= start
  })
}

export function useOverviewCharts() {
  const { user } = useAuth()
  const { token, handleApiError } = useApiErrorHandler()
  const superAdmin = isSuperAdmin(user)

  const [period, setPeriod] = useState<OverviewPeriod>("daily")
  const [remotePartners, setRemotePartners] = useState<ReadonlyArray<PartnerOption>>([])
  const [disabledPartnerIds, setDisabledPartnerIds] = useState<ReadonlySet<number>>(new Set())
  const [payments, setPayments] = useState<ReadonlyArray<PaymentRecord>>([])
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const retry = () => setRetryKey((value) => value + 1)

  const partner = user?.partner ?? null
  const partners: ReadonlyArray<PartnerOption> = superAdmin
    ? remotePartners
    : partner
      ? [{ id: partner.id, name: partner.brand_name || partner.company_name }]
      : []

  const series: ReadonlyArray<PartnerSeries> = partners.map((item, index) => ({
    id: item.id,
    key: partnerValueKey(item.id),
    label: item.name,
    color: PARTNER_COLORS[index % PARTNER_COLORS.length],
  }))

  const toggleItems: ReadonlyArray<PartnerToggleItem> = series.map((item) => ({
    ...item,
    enabled: !disabledPartnerIds.has(item.id),
  }))

  const activePartnerIds = toggleItems.filter((item) => item.enabled).map((item) => item.id)
  const activeSeries = series.filter((item) => activePartnerIds.includes(item.id))

  const revenueRows = buildRevenueRows(payments, activePartnerIds, period)
  const usageRows = buildPaymentCountRows(payments, activePartnerIds, period)

  const labelById = new Map(series.map((item) => [item.id, item.label]))
  const activeSet = new Set(activePartnerIds)
  const ranking: ReadonlyArray<PartnerRankingPoint> = rankPartnersByRevenue(
    payments.filter((item) => activeSet.has(item.partner_id))
  )
    .slice(0, RANKING_SIZE)
    .map((entry) => ({
      name: labelById.get(entry.partnerId) ?? `Partner #${entry.partnerId}`,
      revenue: entry.revenue,
    }))

  function togglePartner(partnerId: number) {
    setDisabledPartnerIds((current) => {
      const next = new Set(current)
      if (next.has(partnerId)) next.delete(partnerId)
      else next.add(partnerId)
      return next
    })
  }

  function setAllPartners(enabled: boolean) {
    setDisabledPartnerIds(enabled ? new Set() : new Set(partners.map((item) => item.id)))
  }

  useEffect(() => {
    if (!token || !superAdmin) return
    const accessToken = token
    const controller = new AbortController()

    getPartners(accessToken, { per_page: 100 }, controller.signal)
      .then((response) => {
        setRemotePartners(
          response.data.map((item) => ({
            id: item.id,
            name: item.brand_name || item.company_name,
          }))
        )
      })
      .catch(() => {
        // Daftar partner hanya untuk filter/penamaan; biarkan kosong bila gagal.
      })

    return () => controller.abort()
  }, [superAdmin, token])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function load() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const start = windowStart(period)
        const paymentRows = await collectPayments(accessToken, start, controller.signal)
        if (controller.signal.aborted) return

        setPayments(paymentRows)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
        setPayments([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server."
        )
        setLoadState("error")
      }
    }

    void load()
    return () => controller.abort()
  }, [handleApiError, period, retryKey, token])

  return {
    period,
    setPeriod,
    superAdmin,
    toggleItems,
    togglePartner,
    setAllPartners,
    activeSeries,
    revenueRows,
    usageRows,
    ranking,
    loadState,
    errorMessage,
    retry,
  }
}
