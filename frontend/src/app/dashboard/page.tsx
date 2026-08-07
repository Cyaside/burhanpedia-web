"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/api/client"
import { AppRole, useAuthGuard } from "@/lib/auth"
import { Button } from "@/components/ui/button"

const roleDescriptions: Record<AppRole, string> = {
  BUYER: "Jelajahi produk, kelola belanja, dan pantau pesanan Anda.",
  SELLER: "Kelola toko, produk, stok, dan pesanan yang masuk.",
  DRIVER: "Lihat pengiriman yang tersedia dan pantau pekerjaan Anda.",
  ADMIN: "Kelola dan awasi operasional marketplace.",
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, checking } = useAuthGuard()
  const [activeRole, setActiveRole] = useState<AppRole | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function switchRole(role: AppRole) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await api.post("/me/roles/active", { role })
      setActiveRole(role)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal mengganti peran.")
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await api.post("/auth/logout")
      router.replace("/login")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal keluar dari akun.")
      setBusy(false)
    }
  }

  if (checking || !user) {
    return <main className="mx-auto max-w-4xl px-6 py-12">Memeriksa sesi...</main>
  }

  const role = activeRole ?? user.activeRole

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Akun Burhanpedia</p>
          <h1 className="text-3xl font-semibold">Halo, {user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={logout}>Keluar</Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Peran aktif: {role}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{roleDescriptions[role]}</p>
        {user.roles.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Ganti peran aktif">
            {user.roles.map((availableRole) => (
              <Button
                key={availableRole}
                type="button"
                variant={role === availableRole ? "default" : "outline"}
                disabled={busy}
                onClick={() => switchRole(availableRole)}
              >
                {availableRole}
              </Button>
            ))}
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      </section>

      {role === "BUYER" && (
        <div className="flex gap-3">
          <Button asChild><Link href="/products">Lihat produk</Link></Button>
          <Button asChild variant="outline"><Link href="/profile">Profil</Link></Button>
        </div>
      )}
      {role === "SELLER" && <Button asChild><Link href="/seller/store">Kelola identitas toko</Link></Button>}
    </main>
  )
}
