"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Button } from "@/components/ui/button";
import { commerceApi, formatMoney } from "@/lib/api/commerce";
import { useRoleGuard } from "@/lib/auth";

export default function CartPage() {
  const { allowed, checking } = useRoleGuard("BUYER");
  const queryClient = useQueryClient();
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: commerceApi.cart,
    enabled: allowed,
  });
  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      commerceApi.updateItem(id, quantity),
    onSuccess: (data) => queryClient.setQueryData(["cart"], data),
  });
  const remove = useMutation({
    mutationFn: commerceApi.removeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (checking || !allowed) return null;
  const groups = cart.data?.groups ?? [];
  const count = groups.reduce(
    (total, group) =>
      total + group.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm text-slate-600">Keranjang</p>
            <h1 className="text-2xl font-semibold">Belanjaan Anda</h1>
          </div>
          <p className="text-sm text-slate-600">{count} barang</p>
        </div>
        {cart.isPending && (
          <p className="py-8 text-sm text-slate-600">Memuat keranjang…</p>
        )}
        {cart.isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            {cart.error.message}
          </p>
        )}
        {!cart.isPending && groups.length === 0 && (
          <div className="mt-6 border bg-white p-8 text-center">
            <p className="text-slate-600">Keranjang masih kosong.</p>
            <Button asChild className="mt-4">
              <Link href="/products">Cari produk</Link>
            </Button>
          </div>
        )}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.id} className="border bg-white">
                <div className="border-b px-4 py-3 font-medium">
                  {group.name}
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b p-4 last:border-b-0"
                  >
                    <div className="relative size-24 shrink-0 overflow-hidden bg-slate-100">
                      {item.product.imageUrl && (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-slate-600">
                        {item.variantName}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(item.unitPriceAmount)}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={update.isPending || item.quantity === 1}
                          onClick={() =>
                            update.mutate({
                              id: item.id,
                              quantity: item.quantity - 1,
                            })
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={
                            update.isPending ||
                            item.quantity >= item.availableQuantity
                          }
                          onClick={() =>
                            update.mutate({
                              id: item.id,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Hapus barang"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(item.id)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatMoney(item.lineTotalAmount)}
                    </p>
                  </div>
                ))}
              </section>
            ))}
          </div>
          {groups.length > 0 && (
            <aside className="h-fit border bg-white p-5 lg:sticky lg:top-28">
              <h2 className="font-semibold">Ringkasan</h2>
              <div className="mt-4 flex justify-between border-b pb-4 text-sm">
                <span>Subtotal</span>
                <strong>{formatMoney(cart.data?.subtotalAmount ?? "0")}</strong>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Ongkos kirim dan diskon dihitung oleh server pada checkout.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href="/checkout">Lanjut checkout</Link>
              </Button>
            </aside>
          )}
        </div>
      </main>
      <MobileDock />
    </div>
  );
}
