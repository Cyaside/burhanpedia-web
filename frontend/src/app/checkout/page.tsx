"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commerceApi, DeliveryMethod, formatMoney } from "@/lib/api/commerce";
import { useAuthGuard } from "@/lib/auth";

const methods: Array<{ value: DeliveryMethod; label: string }> = [
  { value: "INSTANT", label: "Instan" },
  { value: "NEXT_DAY", label: "Besok sampai" },
  { value: "REGULAR", label: "Reguler" },
];

export default function CheckoutPage() {
  const { isAuthenticated, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: commerceApi.cart,
    enabled: isAuthenticated,
  });
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: commerceApi.addresses,
    enabled: isAuthenticated,
  });
  const [addressId, setAddressId] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [delivery, setDelivery] = useState<Record<string, DeliveryMethod>>({});

  useEffect(() => {
    if (!addressId && addresses.data?.length)
      setAddressId(
        addresses.data.find((item) => item.isDefault)?.id ??
          addresses.data[0].id,
      );
  }, [addressId, addresses.data]);
  useEffect(() => {
    if (!cart.data) return;
    setDelivery((current) =>
      Object.fromEntries(
        cart.data.groups.map((group) => [
          group.id,
          current[group.id] ?? "REGULAR",
        ]),
      ),
    );
  }, [cart.data]);

  const input = useMemo(
    () => ({
      addressId,
      voucherCode: appliedVoucher || undefined,
      deliveries: (cart.data?.groups ?? []).map((group) => ({
        storeId: group.id,
        method: delivery[group.id] ?? "REGULAR",
      })),
    }),
    [addressId, appliedVoucher, cart.data, delivery],
  );
  const canQuote = Boolean(addressId && input.deliveries.length);
  const quote = useQuery({
    queryKey: ["checkout-quote", input],
    queryFn: () => commerceApi.quote(input),
    enabled: isAuthenticated && canQuote,
    retry: false,
  });
  const checkout = useMutation({
    mutationFn: () => commerceApi.checkout(input, `web-${crypto.randomUUID()}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (checking || !isAuthenticated) return null;
  if (checkout.data) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="border bg-white p-8">
            <p className="text-sm text-green-700">Pembayaran berhasil</p>
            <h1 className="mt-2 text-2xl font-semibold">
              Pesanan sudah dibuat
            </h1>
            <p className="mt-3 text-slate-600">
              {checkout.data.orders.length} pesanan dibuat dari checkout ini.
            </p>
            <Button asChild className="mt-6">
              <Link href="/profile">Lihat pesanan</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="border-b pb-4 text-2xl font-semibold">Checkout</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="border bg-white p-5">
              <h2 className="font-semibold">Alamat pengiriman</h2>
              <div className="mt-3 space-y-2">
                {addresses.data?.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer gap-3 border p-3"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                    />
                    <span>
                      <strong>{address.label}</strong>
                      <span className="block text-sm text-slate-600">
                        {address.recipientName} · {address.phone}
                      </span>
                      <span className="block text-sm text-slate-600">
                        {address.line1}, {address.city}, {address.province}{" "}
                        {address.postalCode}
                      </span>
                    </span>
                  </label>
                ))}
                {addresses.data?.length === 0 && (
                  <p className="text-sm text-slate-600">
                    Belum ada alamat. Tambahkan melalui API/profile terlebih
                    dahulu.
                  </p>
                )}
              </div>
            </section>
            {cart.data?.groups.map((group) => (
              <section key={group.id} className="border bg-white p-5">
                <h2 className="font-semibold">{group.name}</h2>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <strong>{formatMoney(item.lineTotalAmount)}</strong>
                    </div>
                  ))}
                </div>
                <label className="mt-4 block text-sm font-medium">
                  Metode pengiriman
                  <select
                    className="mt-1 block w-full border bg-white p-2"
                    value={delivery[group.id] ?? "REGULAR"}
                    onChange={(event) =>
                      setDelivery((value) => ({
                        ...value,
                        [group.id]: event.target.value as DeliveryMethod,
                      }))
                    }
                  >
                    {methods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            ))}
            <section className="border bg-white p-5">
              <h2 className="font-semibold">Voucher</h2>
              <div className="mt-3 flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(event) =>
                    setVoucherCode(event.target.value.toUpperCase())
                  }
                  placeholder="Kode voucher"
                />
                <Button
                  variant="outline"
                  onClick={() => setAppliedVoucher(voucherCode.trim())}
                >
                  Terapkan
                </Button>
              </div>
              {quote.isError && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {quote.error.message}
                </p>
              )}
            </section>
          </div>
          <aside className="h-fit border bg-white p-5 lg:sticky lg:top-28">
            <h2 className="font-semibold">Total pembayaran</h2>
            {quote.isPending && canQuote && (
              <p className="mt-4 text-sm text-slate-600">Menghitung harga…</p>
            )}
            {quote.data && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(quote.data.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Diskon</span>
                  <span>-{formatMoney(quote.data.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir</span>
                  <span>{formatMoney(quote.data.shippingAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base">
                  <strong>Total</strong>
                  <strong>{formatMoney(quote.data.totalAmount)}</strong>
                </div>
              </div>
            )}
            <Button
              className="mt-5 w-full"
              disabled={!quote.data || checkout.isPending}
              onClick={() => checkout.mutate()}
            >
              {checkout.isPending ? "Memproses…" : "Bayar dengan wallet"}
            </Button>
            {checkout.isError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {checkout.error.message}
              </p>
            )}
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/cart">Kembali ke keranjang</Link>
            </Button>
          </aside>
        </div>
      </main>
      <MobileDock />
    </div>
  );
}
