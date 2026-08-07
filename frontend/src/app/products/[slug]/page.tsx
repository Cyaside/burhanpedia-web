"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Star, Truck } from "lucide-react";
import { getCatalogProduct, formatRupiah } from "@/lib/api/catalog";
import type { CatalogProduct } from "@/lib/api/catalog";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { Button } from "@/components/ui/button";
import { StoreLogo } from "@/components/shop/StoreLogo";
import { commerceApi } from "@/lib/api/commerce";
import { ensureAuthenticated } from "@/lib/auth";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const product = useQuery({
    queryKey: ["catalog-product", slug],
    queryFn: () => getCatalogProduct(slug),
  });
  const data = product.data;
  const variant = data?.variants.find((item) => item.id === selectedVariant);
  const addToCart = useMutation({
    mutationFn: ({ variantId, count }: { variantId: string; count: number }) =>
      commerceApi.addItem(variantId, count),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  async function addSelected() {
    if (
      !variant ||
      quantity < 1 ||
      quantity > Math.min(variant.availableQuantity, 99)
    )
      return;
    if (!(await ensureAuthenticated(router))) return;
    addToCart.mutate({ variantId: variant.id, count: quantity });
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-36 pt-6 lg:pb-16">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Beranda
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/products" className="hover:text-primary">
            Produk
          </Link>
          {data && (
            <>
              <span aria-hidden="true"> / </span>
              <span aria-current="page" className="text-foreground">
                {data.name}
              </span>
            </>
          )}
        </nav>
        {product.isPending && <DetailSkeleton />}
        {product.isError && (
          <div
            role="alert"
            className="mt-8 rounded-lg border bg-white p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Produk tidak ditemukan atau belum dapat dimuat.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void product.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        )}
        {data && (
          <>
            <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section aria-label="Foto produk" className="min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
                  {data.images[selectedImage] ? (
                    <Image
                      src={data.images[selectedImage].url}
                      alt={data.images[selectedImage].alt || data.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-muted-foreground">
                      Foto produk belum tersedia
                    </div>
                  )}
                </div>
                {data.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {data.images.map((image, index) => (
                      <button
                        key={image.url}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        aria-label={`Lihat foto ${index + 1}`}
                        aria-pressed={selectedImage === index}
                        className={`relative size-16 shrink-0 overflow-hidden rounded-md border-2 ${selectedImage === index ? "border-primary" : "border-border"}`}
                      >
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section aria-labelledby="product-heading" className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {data.category?.name ?? "Produk"}
                </p>
                <h1
                  id="product-heading"
                  className="mt-2 text-2xl font-bold leading-tight sm:text-3xl"
                >
                  {data.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {data.ratingCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star
                        aria-hidden="true"
                        className="size-4 fill-brand-yellow text-brand-yellow"
                      />
                      {data.ratingAverage.toFixed(1)} ({data.ratingCount}{" "}
                      ulasan)
                    </span>
                  ) : (
                    <span>Belum ada ulasan</span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{data.soldCount} terjual</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      data.availableQuantity > 0 ? "text-success" : "text-promo"
                    }
                  >
                    {data.availableQuantity > 0 ? "Tersedia" : "Stok habis"}
                  </span>
                </div>
                <p className="mt-5 border-y py-4 text-3xl font-bold">
                  {formatRupiah(variant?.priceAmount ?? data.minPriceAmount)}
                </p>

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">
                    Pilih varian
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.variants.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selectedVariant === item.id}
                        disabled={item.availableQuantity === 0}
                        onClick={() => {
                          setSelectedVariant(item.id);
                          setQuantity(1);
                          addToCart.reset();
                        }}
                        className={`min-h-11 rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${selectedVariant === item.id ? "border-primary bg-accent text-primary" : "border-input bg-white hover:border-primary"}`}
                      >
                        {item.name} · {formatRupiah(item.priceAmount)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label
                  htmlFor="quantity"
                  className="mt-5 block text-sm font-semibold"
                >
                  Jumlah
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={Math.min(variant?.availableQuantity ?? 99, 99)}
                    value={quantity}
                    disabled={!variant}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                    className="mt-2 block h-11 w-24 rounded-md border border-input bg-white px-3 text-sm"
                  />
                </label>
                <div className="mt-5 space-y-3 border-y py-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Truck aria-hidden="true" className="size-4 text-primary" />{" "}
                    Pilih Instan, Besok, atau Reguler saat checkout.
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />{" "}
                    Total akhir dihitung dan ditampilkan sebelum pembayaran.
                  </p>
                </div>
                <Link
                  href={`/stores/${data.store.slug}`}
                  className="mt-4 flex min-h-14 items-center gap-3 rounded-lg border bg-white px-4 hover:border-primary"
                >
                  <StoreLogo
                    name={data.store.name}
                    logoUrl={data.store.logoUrl}
                    logoAltText={data.store.logoAltText}
                    className="size-10 rounded-lg"
                  />
                  <span className="flex-1">
                    <strong className="block text-sm">{data.store.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      Kunjungi toko
                    </span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
                <div className="mt-5 hidden lg:block">
                  <CartAction
                    data={data}
                    variant={variant}
                    quantity={quantity}
                    pending={addToCart.isPending}
                    add={addSelected}
                  />
                </div>
                <CartMessage
                  success={addToCart.isSuccess}
                  error={addToCart.error?.message}
                />
              </section>
            </div>

            <div className="mt-10 grid gap-7 border-t pt-7 lg:grid-cols-[2fr_1fr]">
              <section id="deskripsi" aria-labelledby="description-heading">
                <h2 id="description-heading" className="text-xl font-bold">
                  Deskripsi produk
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {data.description ||
                    "Penjual belum menambahkan deskripsi produk."}
                </p>
                <h3 className="mt-7 font-semibold">Spesifikasi varian</h3>
                <VariantSpecifications product={data} />
              </section>
              <section id="ulasan" aria-labelledby="review-heading">
                <h2 id="review-heading" className="text-xl font-bold">
                  Ulasan
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {data.ratingCount > 0
                    ? `Rating rata-rata ${data.ratingAverage.toFixed(1)} dari ${data.ratingCount} ulasan. Rincian ulasan belum tersedia.`
                    : "Produk ini belum memiliki ulasan."}
                </p>
              </section>
            </div>
          </>
        )}
      </main>
      {data && (
        <div className="fixed inset-x-0 bottom-14 z-30 border-t bg-white px-4 py-2 lg:hidden">
          <CartAction
            data={data}
            variant={variant}
            quantity={quantity}
            pending={addToCart.isPending}
            add={addSelected}
          />
        </div>
      )}
      <MobileDock />
    </div>
  );
}

function CartAction({
  data,
  variant,
  quantity,
  pending,
  add,
}: {
  data: CatalogProduct;
  variant: CatalogProduct["variants"][number] | undefined;
  quantity: number;
  pending: boolean;
  add: () => void;
}) {
  return (
    <Button
      type="button"
      className="w-full"
      disabled={
        !variant ||
        quantity < 1 ||
        quantity > Math.min(variant.availableQuantity, 99) ||
        pending
      }
      onClick={add}
    >
      {pending
        ? "Menambahkan…"
        : data.availableQuantity === 0
          ? "Stok habis"
          : !variant
            ? "Pilih varian dahulu"
            : "Tambah ke keranjang"}
    </Button>
  );
}

function CartMessage({ success, error }: { success: boolean; error?: string }) {
  return (
    <div aria-live="polite" className="mt-2 text-sm">
      {success && (
        <p className="text-success">
          Produk masuk ke keranjang.{" "}
          <Link href="/cart" className="font-semibold underline">
            Lihat keranjang
          </Link>
        </p>
      )}
      {error && (
        <p role="alert" className="text-promo">
          {error}
        </p>
      )}
    </div>
  );
}

function VariantSpecifications({ product }: { product: CatalogProduct }) {
  const entries = product.variants.flatMap((variant) =>
    Object.entries(variant.attributes).map(([key, value]) => ({
      key: `${variant.id}-${key}`,
      label: `${variant.name} · ${key}`,
      value: String(value),
    })),
  );
  if (entries.length === 0)
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Belum ada spesifikasi tambahan.
      </p>
    );
  return (
    <dl className="mt-3 divide-y rounded-lg border bg-white px-4">
      {entries.map((entry) => (
        <div key={entry.key} className="grid gap-1 py-3 text-sm sm:grid-cols-2">
          <dt className="text-muted-foreground">{entry.label}</dt>
          <dd>{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat detail produk"
      className="mt-6 grid gap-7 lg:grid-cols-2"
    >
      <div className="aspect-square animate-pulse rounded-lg bg-muted" />
      <div className="space-y-4">
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      <span className="sr-only">Memuat detail produk…</span>
    </div>
  );
}
