import { useCallback, useEffect, useMemo, useState } from "react"

import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import { getPayments } from "@/features/payments/payment-service"
import type { PaymentRecord } from "@/features/payments/payment.types"
import { getPrintJobs } from "@/features/print-jobs/print-job-service"
import type { PrintJobRecord } from "@/features/print-jobs/print-job.types"
import {
  buildOverviewSeries,
  normalizeDate,
  rankPartnersByRevenue,
  windowStart,
  type OverviewPeriod,
  type OverviewSeriesPoint,
  type PartnerRankingEntry,
} from "@/features/reports/report-overview"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

export type { OverviewPeriod }

export interface PartnerRankingPoint {
  readonly name: string
  readonly revenue: number
}

const PER_PAGE = 100
const MAX_PAGES = 15
const RANKING_SIZE = 8

async function collectPayments(
  token: string,
  start: string,
  signal: AbortSignal
): Promise<ReadonlyArray<PaymentRecord>> {
  const collected: PaymentRecord[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getPayments(
      token,
      {
        status: "paid",
        sort: "paid_at",
        direction: "desc",
        per_page: PER_PAGE,
        page,
      },
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

async function collectPrintJobs(
  token: string,
  start: string,
  signal: AbortSignal
): Promise<ReadonlyArray<PrintJobRecord>> {
  const collected: PrintJobRecord[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getPrintJobs(
      token,
      { status: "success", per_page: PER_PAGE, page },
      signal
    )
    collected.push(...result.data)

    if (page >= result.meta.last_page || result.data.length === 0) break

    const oldest = normalizeDate(result.data[result.data.length - 1].created_at)
    if (oldest && oldest < start) break
  }

  return collected.filter((job) => {
    const date = normalizeDate(job.finished_at ?? job.created_at)
    return date !== null && date >= start
  })
}

export function useOverviewCharts() {
  const { user } = useAuth()
  const { token, handleApiError } = useApiErrorHandler()
  const superAdmin = isSuperAdmin(user)

  const [period, setPeriod] = useState<OverviewPeriod>("daily")
  const [series, setSeries] = useState<ReadonlyArray<OverviewSeriesPoint>>([])
  const [rankEntries, setRankEntries] = useState<ReadonlyArray<PartnerRankingEntry>>([])
  const [partnerNames, setPartnerNames] = useState<ReadonlyMap<number, string>>(new Map())
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const retry = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token || !superAdmin) return
    const accessToken = token
    const controller = new AbortController()

    getPartners(accessToken, { per_page: 100 }, controller.signal)
      .then((response) => {
        const map = new Map<number, string>()
        for (const partner of response.data) {
          map.set(partner.id, partner.brand_name || partner.company_name)
        }
        setPartnerNames(map)
      })
      .catch(() => {
        // Nama partner hanya pelengkap; biarkan fallback ke "Partner #id".
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
        const [payments, printJobs] = await Promise.all([
          collectPayments(accessToken, start, controller.signal),
          collectPrintJobs(accessToken, start, controller.signal),
        ])
        if (controller.signal.aborted) return

        setSeries(buildOverviewSeries(payments, printJobs, period))
        setRankEntries(rankPartnersByRevenue(payments).slice(0, RANKING_SIZE))
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
        setSeries([])
        setRankEntries([])
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

  const ranking = useMemo<ReadonlyArray<PartnerRankingPoint>>(
    () =>
      rankEntries.map((entry) => ({
        name: partnerNames.get(entry.partnerId) ?? `Partner #${entry.partnerId}`,
        revenue: entry.revenue,
      })),
    [partnerNames, rankEntries]
  )

  return {
    period,
    setPeriod,
    superAdmin,
    series,
    ranking,
    loadState,
    errorMessage,
    retry,
  }
}
