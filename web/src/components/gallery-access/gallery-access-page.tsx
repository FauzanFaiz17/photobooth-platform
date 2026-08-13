import { ArrowRight, Link2, TriangleAlert } from "lucide-react"
import { useState, type FormEvent, type ReactElement } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function readToken(value: string): string {
  const trimmed = value.trim()
  try {
    const pathname = new URL(trimmed).pathname
    const match = pathname.match(/gallery\/([A-Za-z0-9]{64})$/)
    if (match?.[1]) return match[1]
  } catch {
    // Input may be a raw token rather than a URL.
  }
  return trimmed
}

export function GalleryAccessPage(): ReactElement {
  const navigate = useNavigate()
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const token = readToken(value)
    if (!/^[A-Za-z0-9]{64}$/.test(token)) {
      setError("Masukkan token gallery 64 karakter atau URL Public Gallery yang valid.")
      return
    }
    navigate(`/gallery/${token}`)
  }

  return <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8"><header><h1 className="text-3xl font-semibold tracking-tight">Public Gallery</h1><p className="mt-1 text-sm text-muted-foreground">Dashboard belum memiliki daftar gallery. Buka gallery asli menggunakan token dari Photo Session selesai.</p></header><Card className="max-w-2xl"><CardHeader><CardTitle>Buka gallery dengan token</CardTitle><CardDescription>Token dapat berupa 64 karakter atau URL yang dibuat backend.</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={submit} noValidate><div className="grid gap-2"><Label htmlFor="gallery-token">Token atau URL gallery</Label><Input id="gallery-token" value={value} placeholder="64-character-token atau https://.../gallery/token" onChange={(event) => { setValue(event.target.value); setError("") }} /></div>{error && <p role="alert" className="flex items-start gap-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}<Button type="submit" className="w-fit"><Link2 aria-hidden="true" /> Buka Public Gallery <ArrowRight aria-hidden="true" /></Button></form></CardContent></Card></div>
}
