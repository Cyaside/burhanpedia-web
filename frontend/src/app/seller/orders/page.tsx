"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/api/commerce";
import { operationsApi } from "@/lib/api/operations";
import { useAuthGuard } from "@/lib/auth";

export default function SellerOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "SELLER") router.replace("/dashboard");
  }, [checking, router, user]);
  const orders = useQuery({
    queryKey: ["seller-orders"],
    queryFn: operationsApi.sellerOrders,
    enabled: user?.activeRole === "SELLER",
  });
  const process = useMutation({
    mutationFn: operationsApi.processSellerOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-orders"] }),
  });

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-8">
        <p className="text-sm text-muted-foreground">Pusat seller</p>
        <h1 className="mt-1 text-3xl font-bold">Pesanan masuk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selesaikan pengemasan agar pesanan tersedia untuk driver.
        </p>
        <SellerNavigation />

        {orders.isPending && <p className="mt-8 text-sm">Memuat pesanan…</p>}
        {orders.isError && <p role="alert" className="mt-8 text-sm text-destructive">{orders.error.message}</p>}
        {orders.data?.length === 0 && (
          <section className="mt-8 border-y py-12 text-center">
            <h2 className="text-lg font-bold">Belum ada pesanan</h2>
            <p className="mt-2 text-sm text-muted-foreground">Pesanan buyer akan muncul di halaman ini.</p>
          </section>
        )}
        <div className="mt-8 space-y-4">
          {orders.data?.map((order) => (
            <article key={order.id} className="rounded-lg border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{order.number}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.placedAt).toLocaleString("id-ID")} · {deliveryLabel(order.deliveryMethod)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">{statusLabel(order.status)}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total pesanan</p>
                  <p className="mt-1 text-lg font-bold">{formatMoney(order.totalAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Batas pengiriman {new Date(order.deliveryDeadlineAt).toLocaleString("id-ID")}
                  </p>
                </div>
                {order.status === "PACKING" && (
                  <Button type="button" disabled={process.isPending} onClick={() => process.mutate(order.id)}>
                    {process.isPending ? "Memproses…" : "Selesai dikemas"}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        {process.isError && <p role="alert" className="mt-4 text-sm text-destructive">{process.error.message}</p>}
        <Button asChild variant="link" className="mt-6 px-0">
          <Link href="/seller/products">Kelola produk toko</Link>
        </Button>
      </main>
    </div>
  );
}

function statusLabel(status: string) {
  return {
    PACKING: "Perlu dikemas",
    AWAITING_DRIVER: "Menunggu driver",
    DRIVER_ASSIGNED: "Driver ditugaskan",
    IN_TRANSIT: "Dalam pengiriman",
    DELIVERED: "Sudah tiba",
    COMPLETED: "Selesai",
    RETURNED: "Dikembalikan",
    REFUNDED: "Dikembalikan dananya",
  }[status] ?? status;
}

function deliveryLabel(method: string) {
  return { INSTANT: "Instan", NEXT_DAY: "Besok", REGULAR: "Reguler" }[method] ?? method;
}
