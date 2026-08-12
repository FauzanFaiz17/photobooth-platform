import { Building2, RefreshCw, Search, Ticket } from "lucide-react"
import { useEffect, useMemo, useState, type ReactElement } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { getPartners } from "@/features/partners/partner-service"
import { ApiError } from "@/lib/api-client"

interface PartnerOption { readonly id: number; readonly companyName: string; readonly brandName: string | null }

export function VoucherListPage(): ReactElement {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [partners, setPartners] = useState<ReadonlyArray<PartnerOption>>([])
  const [query, setQuery] = useState("")
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const superAdmin = isSuperAdmin(user)

  useEffect(() => {
    if (!token) return
    const accessToken = token
    async function load(): Promise<void> {
      setState("loading")
      try {
        if (superAdmin) {
          const response = await getPartners(accessToken, { per_page: 100 })
          setPartners(response.data.map((partner) => ({ id: partner.id, companyName: partner.company_name, brandName: partner.brand_name })))
        } else if (user?.partner) {
          setPartners([{
            id: user.partner.id,
            companyName: user.partner.company_name,
            brandName: user.partner.brand_name,
          }])
        } else {
          setPartners([])
        }
        setState("success")
        setError("")
      } catch (caught: unknown) {
        if (caught instanceof ApiError && caught.status === 401) {
          await logout()
          navigate("/login", { replace: true })
          return
        }
        setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
        setState("error")
      }
    }
    void load()
  }, [logout, navigate, retry, superAdmin, token, user])

  const visiblePartners = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID")
    if (!normalized) return partners
    return partners.filter((partner) => `${partner.companyName} ${partner.brandName ?? ""}`.toLocaleLowerCase("id-ID").includes(normalized))
  }, [partners, query])

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">Voucher</h1><p className="mt-1 text-sm text-muted-foreground">Pilih Partner untuk mengelola package dan voucher.</p></div>
        <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Partner" aria-label="Cari Partner" /></div>
      </header>
      {state === "loading" && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-40" />)}</div>}
      {state === "error" && <Card><CardContent className="grid min-h-48 place-items-center gap-3 p-6 text-center"><div><p className="font-medium">Data Partner gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button variant="outline" className="mt-4" onClick={() => setRetry((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}
      {state === "success" && visiblePartners.length === 0 && <Card><CardContent className="grid min-h-48 place-items-center p-6 text-center"><Building2 className="size-10 opacity-50" /><p className="font-medium">Partner tidak ditemukan</p></CardContent></Card>}
      {state === "success" && visiblePartners.length > 0 && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visiblePartners.map((partner) => <Card key={partner.id} className="transition-shadow hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5" />{partner.brandName || partner.companyName}</CardTitle><p className="text-sm text-muted-foreground">{partner.companyName}</p></CardHeader><CardContent><Button className="w-full" render={<Link to={`/voucher/${partner.id}`} />}><Ticket aria-hidden="true" /> Kelola Voucher</Button></CardContent></Card>)}</div>}
    </div>
  )
}
