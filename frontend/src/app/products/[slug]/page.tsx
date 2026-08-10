"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import {
  getCatalogProduct,
  getProductReviews,
  formatRupiah,
} from "@/lib/api/catalog";
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
  const reviews = useQuery({
    queryKey: ["product-reviews", data?.id],
    queryFn: () => getProductReviews(data!.id),
    enabled: Boolean(data),
  });
  const variant =
    data?.variants.find((item) => item.id === selectedVariant) ??
    (data?.variants.length === 1 ? data.variants[0] : undefined);
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
            <div className="mt-6 grid items-start gap-7 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_20rem]">
              <section aria-label="Foto produk" className="min-w-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-white">
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

                {data.variants.length > 1 && (
                  <fieldset className="mt-5 border-t pt-5">
                    <legend className="text-sm font-semibold">
                      Pilih varian
                    </legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {data.variants.map((item) => {
                        const selected = selectedVariant === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            disabled={item.availableQuantity === 0}
                            onClick={() => {
                              setSelectedVariant(item.id);
                              setQuantity(1);
                              addToCart.reset();
                            }}
                            className={`min-h-14 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                              selected
                                ? "border-primary bg-accent text-primary"
                                : item.availableQuantity === 0
                                  ? "border-border bg-muted text-muted-foreground"
                                  : "border-input bg-white hover:border-primary"
                            }`}
                          >
                            <span className="block font-semibold">{item.name}</span>
                            <span className="mt-0.5 block text-xs">
                              {item.availableQuantity === 0
                                ? "Stok habis"
                                : `${formatRupiah(item.priceAmount)} · stok ${item.availableQuantity}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
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
                    className="size-10"
                  />
                  <span className="flex-1">
                    <strong className="block text-sm">{data.store.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      Kunjungi toko
                    </span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </section>

              <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-28">
                <PurchaseCard
                  data={data}
                  variant={variant}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  pending={addToCart.isPending}
                  add={addSelected}
                  success={addToCart.isSuccess}
                  error={addToCart.error?.message}
                />
              </aside>
            </div>

            <div className="mt-10 border-t pt-8">
              <section
                id="deskripsi"
                aria-labelledby="description-heading"
                className="max-w-4xl"
              >
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
            </div>

            <section
              id="ulasan"
              aria-labelledby="review-heading"
              className="mt-10 border-t pt-8"
            >
              <h2 id="review-heading" className="text-xl font-bold">
                Ulasan pembeli
              </h2>
              <div className="mt-5 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <div>
                  {data.ratingCount > 0 ? (
                    <>
                      <p className="text-4xl font-bold">
                        {data.ratingAverage.toFixed(1)}
                        <span className="text-lg font-medium text-muted-foreground">
                          /5
                        </span>
                      </p>
                      <p className="mt-2 flex gap-1" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`size-5 ${index < Math.round(data.ratingAverage) ? "fill-brand-yellow text-brand-yellow" : "text-border"}`}
                          />
                        ))}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {data.ratingCount} ulasan terverifikasi
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Produk ini belum memiliki ulasan.
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  {reviews.isPending && (
                    <p className="text-sm text-muted-foreground">Memuat ulasan…</p>
                  )}
                  {reviews.data?.items.map((review) => (
                    <article key={review.id} className="border-t py-5 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{review.reviewerName}</p>
                        <span className="text-xs text-success">
                          Pembelian terverifikasi
                        </span>
                      </div>
                      <p
                        className="mt-1 flex gap-0.5"
                        aria-label={`${review.rating} dari 5 bintang`}
                      >
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            aria-hidden="true"
                            className={`size-3.5 ${index < review.rating ? "fill-brand-yellow text-brand-yellow" : "text-border"}`}
                          />
                        ))}
                      </p>
                      {review.comment && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </section>
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

function PurchaseCard({
  data,
  variant,
  quantity,
  setQuantity,
  pending,
  add,
  success,
  error,
}: {
  data: CatalogProduct;
  variant: CatalogProduct["variants"][number] | undefined;
  quantity: number;
  setQuantity: (quantity: number) => void;
  pending: boolean;
  add: () => void;
  success: boolean;
  error?: string;
}) {
  const maximum = Math.min(variant?.availableQuantity ?? 1, 99);
  const subtotal = variant
    ? (BigInt(variant.priceAmount) * BigInt(quantity)).toString()
    : null;

  return (
    <section
      aria-labelledby="purchase-heading"
      className="rounded-lg border bg-white p-5"
    >
      <h2 id="purchase-heading" className="text-lg font-bold">
        Atur jumlah
      </h2>
      <div className="mt-4 border-b pb-4">
        <p className="text-xs text-muted-foreground">Varian terpilih</p>
        <p className="mt-1 text-sm font-semibold">
          {variant?.name ?? "Pilih varian produk terlebih dahulu"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <QuantityStepper
          value={quantity}
          maximum={maximum}
          disabled={!variant || variant.availableQuantity === 0}
          onChange={setQuantity}
        />
        <p className="text-sm text-muted-foreground">
          Stok: <strong className="text-foreground">{variant?.availableQuantity ?? "—"}</strong>
        </p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4 border-t pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <strong className="text-xl">
          {subtotal ? formatRupiah(subtotal) : "—"}
        </strong>
      </div>
      <div className="mt-5 hidden lg:block">
        <CartAction
          data={data}
          variant={variant}
          quantity={quantity}
          pending={pending}
          add={add}
        />
      </div>
      <CartMessage success={success} error={error} />
    </section>
  );
}

function QuantityStepper({
  value,
  maximum,
  disabled,
  onChange,
}: {
  value: number;
  maximum: number;
  disabled: boolean;
  onChange: (quantity: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Jumlah produk"
      className="inline-grid h-11 grid-cols-[2.75rem_3rem_2.75rem] overflow-hidden rounded-md border border-input bg-white"
    >
      <button
        type="button"
        aria-label="Kurangi jumlah"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid place-items-center text-primary hover:bg-accent disabled:text-muted-foreground"
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <output
        aria-live="polite"
        aria-label={`${value} barang`}
        className="grid place-items-center border-x border-input text-sm font-semibold"
      >
        {value}
      </output>
      <button
        type="button"
        aria-label="Tambah jumlah"
        disabled={disabled || value >= maximum}
        onClick={() => onChange(Math.min(maximum, value + 1))}
        className="grid place-items-center text-primary hover:bg-accent disabled:text-muted-foreground"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
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
      <ShoppingCart aria-hidden="true" />
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
