"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bike, ChevronRight, Package, ReceiptText, Settings2, ShoppingBag, Store, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { AppRole, useAuthGuard } from "@/lib/auth";

const roleContent: Record<AppRole, { title: string; description: string; links: Array<{ href: string; title: string; description: string; icon: LucideIcon }> }> = {
  BUYER: {
    title: "Belanja saya",
    description: "Temukan produk, periksa keranjang, dan ikuti pesanan Anda.",
    links: [
      { href: "/products", title: "Jelajahi produk", description: "Cari barang dan bandingkan pilihan", icon: ShoppingBag },
      { href: "/cart", title: "Keranjang", description: "Lanjutkan belanja yang tersimpan", icon: Package },
      { href: "/profile", title: "Pesanan & wallet", description: "Lihat status, ulasan, dan saldo", icon: Wallet },
    ],
  },
  SELLER: {
    title: "Pusat seller",
    description: "Kelola etalase dan pekerjaan toko dari satu tempat.",
    links: [
      { href: "/seller/products", title: "Produk & stok", description: "Atur varian, harga, foto, dan publikasi", icon: Package },
      { href: "/seller/orders", title: "Pesanan masuk", description: "Siapkan pesanan untuk pengiriman", icon: ReceiptText },
      { href: "/seller/finance", title: "Ringkasan keuangan", description: "Pantau nilai pesanan toko", icon: Wallet },
      { href: "/seller/store", title: "Identitas toko", description: "Atur nama dan logo toko", icon: Store },
    ],
  },
  DRIVER: {
    title: "Pusat driver",
    description: "Ambil pengiriman dan pantau pekerjaan serta pendapatan.",
    links: [
      { href: "/driver", title: "Pengiriman", description: "Job tersedia, pengiriman aktif, dan riwayat", icon: Bike },
    ],
  },
  ADMIN: {
    title: "Operasional",
    description: "Pantau transaksi, pekerjaan sistem, dan voucher.",
    links: [
      { href: "/admin", title: "Monitoring admin", description: "Status sistem, voucher, dan simulasi lokal", icon: Settings2 },
    ],
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, checking } = useAuthGuard();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function switchRole(role: AppRole) {
    if (busy || role === (selectedRole ?? user?.activeRole)) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/me/roles/active", { role });
      setSelectedRole(role);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal mengganti peran.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/logout");
      router.replace("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal keluar dari akun.");
      setBusy(false);
    }
  }

  if (checking || !user) return <main className="page-container py-12 text-sm">Memeriksa sesi…</main>;
  const role = selectedRole ?? user.activeRole;
  const content = roleContent[role];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container max-w-5xl pb-24 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm text-muted-foreground">Akun Burhanpedia</p>
            <h1 className="mt-1 text-3xl font-bold">Halo, {user.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void logout()}>Keluar</Button>
        </div>

        <section aria-labelledby="role-heading" className="mt-8">
          <div className="flex items-center gap-3">
            <UserRound aria-hidden="true" className="size-5 text-primary" />
            <h2 id="role-heading" className="text-lg font-bold">Peran aktif</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Ganti peran aktif">
            {user.roles.map((available) => (
              <Button key={available} type="button" variant={role === available ? "default" : "outline"} disabled={busy} aria-pressed={role === available} onClick={() => void switchRole(available)}>
                {roleLabel(available)}
              </Button>
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </section>

        <section aria-labelledby="workspace-heading" className="mt-10">
          <h2 id="workspace-heading" className="text-2xl font-bold">{content.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
          <div className="mt-5 divide-y overflow-hidden rounded-lg border bg-white">
            {content.links.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-4 px-5 py-4 hover:bg-accent">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function roleLabel(role: AppRole) {
  return { BUYER: "Pembeli", SELLER: "Seller", DRIVER: "Driver", ADMIN: "Admin" }[role];
}
