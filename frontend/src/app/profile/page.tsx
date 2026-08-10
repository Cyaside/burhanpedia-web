"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Star, Wallet } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commerceApi, formatMoney } from "@/lib/api/commerce";
import type { OrderSummary } from "@/lib/api/commerce";
import { useAuthGuard } from "@/lib/auth";

export default function ProfilePage() {
  const { isAuthenticated, checking, user } = useAuthGuard();
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState("100000");
  const topUpAttempt = useRef<{ amount: number; key: string } | null>(null);
  const topUp = useMutation({
    mutationFn: (amount: number) => {
      if (topUpAttempt.current?.amount !== amount) {
        topUpAttempt.current = { amount, key: `web-${crypto.randomUUID()}` };
      }
      return commerceApi.demoTopUp(amount, topUpAttempt.current.key);
    },
    onSuccess: () => {
      topUpAttempt.current = null;
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
  function submitTopUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(topUpAmount);
    if (Number.isInteger(amount) && amount >= 10_000 && amount <= 100_000_000) {
      topUp.mutate(amount);
    }
  }
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
                  <Button asChild variant="link" size="sm" className="mt-2 px-0">
                    <Link href={`/orders/${order.id}`}>Lihat detail dan pelacakan</Link>
                  </Button>
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-slate-500">{item.variantName}</p>
                        {order.status === "COMPLETED" && (
                          <ReviewForm orderId={order.id} item={item} />
                        )}
                      </div>
                    ))}
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
            {process.env.NODE_ENV !== "production" && (
              <form onSubmit={submitTopUp} className="mt-5 border-t pt-4">
                <label htmlFor="top-up-amount" className="text-sm font-medium">
                  Isi saldo demo
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="top-up-amount"
                    type="number"
                    min="10000"
                    max="100000000"
                    step="1000"
                    required
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                  />
                  <Button type="submit" disabled={topUp.isPending}>
                    {topUp.isPending ? "Memproses…" : "Isi"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Hanya untuk pengujian lokal, bukan pembayaran nyata.
                </p>
                {topUp.isError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {topUp.error.message}
                  </p>
                )}
              </form>
            )}
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
                      BigInt(entry.amountDelta) >= BigInt(0)
                        ? "text-green-700"
                        : "text-slate-900"
                    }
                  >
                    {BigInt(entry.amountDelta) >= BigInt(0) ? "+" : ""}
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

function ReviewForm({
  orderId,
  item,
}: {
  orderId: string;
  item: OrderSummary["items"][number];
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(item.review?.rating ?? 0);
  const [comment, setComment] = useState(item.review?.comment ?? "");
  const review = useMutation({
    mutationFn: () =>
      commerceApi.saveReview(orderId, item.id, {
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["catalog-product", item.productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["product-reviews", item.productId],
      });
    },
  });

  return (
    <form
      className="mt-3 rounded-md border bg-slate-50 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (rating > 0) review.mutate();
      }}
    >
      <fieldset>
        <legend className="text-xs font-semibold">
          {item.review ? "Perbarui ulasan" : "Nilai produk"}
        </legend>
        <div className="mt-2 flex gap-1" aria-label="Pilih rating produk">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} bintang`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className="rounded p-1 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Star
                aria-hidden="true"
                className={`size-5 ${value <= rating ? "fill-brand-yellow text-brand-yellow" : "text-slate-300"}`}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`review-${item.id}`} className="sr-only">
        Komentar ulasan
      </label>
      <Textarea
        id={`review-${item.id}`}
        value={comment}
        maxLength={2000}
        placeholder="Ceritakan pengalaman dengan produk ini (opsional)"
        className="mt-2 min-h-20 bg-white"
        onChange={(event) => setComment(event.target.value)}
      />
      <Button type="submit" size="sm" className="mt-2" disabled={rating === 0 || review.isPending}>
        {review.isPending ? "Menyimpan…" : item.review ? "Perbarui" : "Kirim ulasan"}
      </Button>
      {review.isSuccess && (
        <span role="status" className="ml-3 text-xs text-green-700">
          Ulasan tersimpan.
        </span>
      )}
      {review.isError && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {review.error.message}
        </p>
      )}
    </form>
  );
}
