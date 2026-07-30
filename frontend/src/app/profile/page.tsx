"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Wallet } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Badge } from "@/components/ui/badge";
import { commerceApi, formatMoney } from "@/lib/api/commerce";
import { useAuthGuard } from "@/lib/auth";

export default function ProfilePage() {
  const { isAuthenticated, checking, user } = useAuthGuard();
  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: commerceApi.orders,
    enabled: isAuthenticated,
  });
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: commerceApi.wallet,
    enabled: isAuthenticated,
  });
  if (checking || !isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <p className="text-sm text-slate-600">Akun pembeli</p>
        <h1 className="text-2xl font-semibold">{user?.name}</h1>
        <p className="text-sm text-slate-600">{user?.email}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Package className="size-5" /> Riwayat pesanan
              </h2>
              <Badge variant="outline">{orders.data?.length ?? 0}</Badge>
            </div>
            <div className="mt-4 divide-y">
              {orders.isPending && (
                <p className="py-4 text-sm text-slate-600">Memuat pesanan…</p>
              )}
              {orders.data?.map((order) => (
                <article key={order.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{order.number}</p>
                      <p className="text-sm text-slate-600">
                        {order.storeName} · {order.deliveryMethod}
                      </p>
                    </div>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      {new Date(order.placedAt).toLocaleDateString("id-ID")}
                    </span>
                    <strong>{formatMoney(order.totalAmount)}</strong>
                  </div>
                </article>
              ))}
              {!orders.isPending && orders.data?.length === 0 && (
                <p className="py-4 text-sm text-slate-600">
                  Belum ada pesanan.
                </p>
              )}
            </div>
          </section>
          <section className="h-fit border bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Wallet className="size-5" /> Wallet
            </h2>
            <p className="mt-4 text-sm text-slate-600">Saldo tersedia</p>
            <p className="text-2xl font-semibold">
              {formatMoney(wallet.data?.balanceAmount ?? "0")}
            </p>
            <div className="mt-5 divide-y border-t">
              {wallet.data?.items.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between py-3 text-sm"
                >
                  <div>
                    <p>{entry.description ?? entry.type}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <strong
                    className={
                      Number(entry.amountDelta) >= 0
                        ? "text-green-700"
                        : "text-slate-900"
                    }
                  >
                    {Number(entry.amountDelta) >= 0 ? "+" : ""}
                    {formatMoney(entry.amountDelta)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <MobileDock />
    </div>
  );
}
