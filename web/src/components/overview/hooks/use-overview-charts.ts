import { useCallback, useEffect, useMemo, useState } from "react"

import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import {
  buildDailySeries,
  buildMonthlySeries,
  buildWeeklySeries,
  rankPartnersByRevenue,
  shiftISODate,
  type OverviewSeriesPoint,
  type PartnerRankingEntry,
} from "@/features/reports/report-overview"
import {
  getDailyReportWindow,
  getMonthlyReportWindow,
} from "@/features/reports/report-service"
import type {
  PartnerDailyReport,
  PartnerMonthlyReport,
} from "@/features/reports/report.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

export type OverviewPeriod = "daily" | "weekly" | "monthly"

export interface PartnerRankingPoint {
  readonly name: string
  readonly revenue: number
}

const DAILY_DAYS = 30
const WEEKLY_WEEKS = 12
const MONTHLY_MONTHS = 12
const RANKING_SIZE = 8
const MAX_PAGES = 15

function oldestAndLatestDates(
  rows: ReadonlyArray<PartnerDailyReport>
): { oldest: string; latest: string } {
  let oldest = rows[0].stat_date
  let latest = rows[0].stat_date

  for (const row of rows) {
    if (row.stat_date < oldest) oldest = row.stat_date
    if (row.stat_date > latest) latest = row.stat_date
  }

  return { oldest, latest }
}

function reachedDailyWindow(
  rows: ReadonlyArray<PartnerDailyReport>,
  days: number
): boolean {
  if (rows.length === 0) return false
  const { oldest, latest } = oldestAndLatestDates(rows)
  return oldest <= shiftISODate(latest, -(days - 1))
}

function distinctMonths(rows: ReadonlyArray<PartnerMonthlyReport>): number {
  return new Set(rows.map((row) => `${row.period_year}-${row.period_month}`)).size
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
        if (period === "monthly") {
          const rows = await getMonthlyReportWindow(
            accessToken,
            {
              maxPages: MAX_PAGES,
              shouldStop: (collected) => distinctMonths(collected) >= MONTHLY_MONTHS,
            },
            controller.signal
          )
          if (controller.signal.aborted) return
          setSeries(buildMonthlySeries(rows, MONTHLY_MONTHS))
          setRankEntries(rankPartnersByRevenue(rows).slice(0, RANKING_SIZE))
        } else {
          const windowDays = period === "daily" ? DAILY_DAYS : WEEKLY_WEEKS * 7
          const rows = await getDailyReportWindow(
            accessToken,
            {
              maxPages: MAX_PAGES,
              shouldStop: (collected) => reachedDailyWindow(collected, windowDays),
            },
            controller.signal
          )
          if (controller.signal.aborted) return
          setSeries(
            period === "daily"
              ? buildDailySeries(rows, DAILY_DAYS)
              : buildWeeklySeries(rows, WEEKLY_WEEKS)
          )
          setRankEntries(rankPartnersByRevenue(rows).slice(0, RANKING_SIZE))
        }

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
