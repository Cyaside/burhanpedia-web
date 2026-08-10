"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { formatMoney } from "@/lib/api/commerce";
import { operationsApi } from "@/lib/api/operations";
import { useAuthGuard } from "@/lib/auth";

export default function SellerFinancePage() {
  const router = useRouter();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "SELLER") router.replace("/dashboard");
  }, [checking, router, user]);
  const orders = useQuery({
    queryKey: ["seller-orders"],
    queryFn: operationsApi.sellerOrders,
    enabled: user?.activeRole === "SELLER",
  });
  const finance = useQuery({
    queryKey: ["seller-finance"],
    queryFn: operationsApi.sellerFinance,
    enabled: user?.activeRole === "SELLER",
  });

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-8">
        <p className="text-sm text-muted-foreground">Pusat seller</p>
        <h1 className="mt-1 text-3xl font-bold">Ringkasan keuangan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nilai berikut berasal dari pesanan toko dan belum mewakili sistem pencairan dana.
        </p>
        <SellerNavigation />

        {finance.isPending && <p className="mt-8 text-sm">Menghitung ringkasan…</p>}
        {finance.isError && <p role="alert" className="mt-8 text-sm text-destructive">{finance.error.message}</p>}
        {orders.isError && <p role="alert" className="mt-8 text-sm text-destructive">{orders.error.message}</p>}
        {finance.data && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <Metric label="Nilai pesanan valid" value={formatMoney(finance.data.validAmount)} detail={`${finance.data.validCount} pesanan`} />
              <Metric label="Pesanan selesai" value={formatMoney(finance.data.completedAmount)} detail={`${finance.data.completedCount} pesanan`} />
              <Metric label="Dalam proses" value={formatMoney((BigInt(finance.data.validAmount) - BigInt(finance.data.completedAmount)).toString())} />
            </section>
            <section className="mt-8 rounded-lg border bg-white p-5">
              <h2 className="text-lg font-bold">Transaksi terbaru</h2>
              <div className="mt-4 divide-y">
                {orders.data?.slice(0, 20).map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                    <div>
                      <p className="font-semibold">{order.number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(order.placedAt).toLocaleDateString("id-ID")} · {order.status}</p>
                    </div>
                    <strong>{formatMoney(order.totalAmount)}</strong>
                  </div>
                ))}
                {orders.data?.length === 0 && <p className="py-6 text-sm text-muted-foreground">Belum ada transaksi.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-lg border bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </article>
  );
}
