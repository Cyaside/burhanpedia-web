"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Button } from "@/components/ui/button";
import { commerceApi, formatMoney } from "@/lib/api/commerce";
import { useAuthGuard } from "@/lib/auth";

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, checking } = useAuthGuard();
  const order = useQuery({ queryKey: ["order", id], queryFn: () => commerceApi.order(id), enabled: isAuthenticated });
  const complete = useMutation({
    mutationFn: () => commerceApi.completeOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (checking || !isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container max-w-5xl pb-24 pt-8">
        <Link href="/profile" className="text-sm text-primary hover:underline">← Riwayat pesanan</Link>
        {order.isPending && <p className="mt-8 text-sm">Memuat pesanan…</p>}
        {order.isError && <p role="alert" className="mt-8 text-sm text-destructive">{order.error.message}</p>}
        {order.data && (
          <>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-sm text-muted-foreground">{order.data.number}</p><h1 className="mt-1 text-3xl font-bold">Pesanan dari {order.data.storeName}</h1></div>
              <span className="text-sm font-semibold text-primary">{statusLabel(order.data.status)}</span>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-6">
                <section className="rounded-lg border bg-white p-5">
                  <h2 className="text-lg font-bold">Produk</h2>
                  <div className="mt-4 divide-y">
                    {order.data.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                        <div><Link href={`/products/${item.productId}`} className="text-sm font-semibold hover:text-primary hover:underline">{item.productName}</Link><p className="mt-1 text-xs text-muted-foreground">{item.variantName} · {item.quantity} barang</p></div>
                        <strong className="text-sm">{formatMoney(item.lineTotalAmount)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-lg border bg-white p-5">
                  <h2 className="text-lg font-bold">Perjalanan pesanan</h2>
                  <ol className="mt-5 space-y-4 border-l-2 border-border pl-5">
                    {order.data.history.map((event, index) => (
                      <li key={`${event.to}-${event.createdAt}-${index}`} className="relative">
                        <span aria-hidden="true" className="absolute -left-[1.7rem] top-1 size-3 rounded-full bg-primary" />
                        <p className="text-sm font-semibold">{statusLabel(event.to)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString("id-ID")}{event.reason ? ` · ${reasonLabel(event.reason)}` : ""}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
              <aside className="space-y-6">
                <section className="rounded-lg border bg-white p-5">
                  <h2 className="font-bold">Ringkasan pembayaran</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <Row label="Subtotal" value={formatMoney(order.data.subtotalAmount)} />
                    <Row label="Diskon" value={`− ${formatMoney(order.data.discountAmount)}`} />
                    <Row label="Pengiriman" value={formatMoney(order.data.shippingAmount)} />
                    <div className="flex justify-between gap-4 border-t pt-3 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.data.totalAmount)}</dd></div>
                  </dl>
                </section>
                <section className="rounded-lg border bg-white p-5">
                  <h2 className="font-bold">Alamat penerima</h2>
                  <address className="mt-3 text-sm not-italic leading-6 text-muted-foreground">
                    <strong className="text-foreground">{order.data.address.recipientName}</strong><br />
                    {order.data.address.phone}<br />
                    {order.data.address.line1}{order.data.address.line2 ? `, ${order.data.address.line2}` : ""}<br />
                    {order.data.address.city}, {order.data.address.province} {order.data.address.postalCode}
                  </address>
                </section>
                {order.data.status === "DELIVERED" && (
                  <section className="rounded-lg border bg-white p-5">
                    <h2 className="font-bold">Pesanan sudah tiba?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Konfirmasi setelah seluruh barang diterima dengan baik.</p>
                    <Button className="mt-4 w-full" disabled={complete.isPending} onClick={() => complete.mutate()}>{complete.isPending ? "Memproses…" : "Konfirmasi diterima"}</Button>
                    {complete.isError && <p role="alert" className="mt-3 text-sm text-destructive">{complete.error.message}</p>}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
      <MobileDock />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>;
}

function statusLabel(status: string) {
  return { PACKING: "Sedang dikemas", AWAITING_DRIVER: "Menunggu driver", DRIVER_ASSIGNED: "Driver ditugaskan", IN_TRANSIT: "Dalam perjalanan", DELIVERED: "Sudah tiba", COMPLETED: "Selesai", RETURNED: "Dikembalikan", REFUNDED: "Dana dikembalikan" }[status] ?? status;
}

function reasonLabel(reason: string) {
  return {
    "Checkout completed": "Pembayaran selesai",
    "Seller finished packing": "Seller selesai mengemas",
    "Driver claimed delivery": "Driver mengambil tugas",
    "Driver picked up order": "Pesanan diambil driver",
    "Driver delivered order": "Pesanan telah diantar",
    "Buyer confirmed delivery": "Pembeli mengonfirmasi penerimaan",
  }[reason] ?? reason;
}
