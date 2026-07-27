import { ShieldX } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export default function ForbiddenPage() {
  return (
    <section className="grid min-h-[50vh] place-items-center p-6">
      <div className="max-w-md text-center">
        <ShieldX
          className="mx-auto size-10 text-destructive"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-medium text-destructive">403</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Akses ditolak
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya tersedia untuk Super Admin.
        </p>
        <Button className="mt-6" render={<Link to="/admin" />}>
          Kembali ke Overview
        </Button>
      </div>
    </section>
  )
}
