"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { CatalogProductCard } from "@/components/shop/CatalogProductCard";
import { StoreLogo } from "@/components/shop/StoreLogo";
import {
  CatalogEmpty,
  CatalogError,
  ProductGridSkeleton,
} from "@/components/shop/CatalogFeedback";
import { Button } from "@/components/ui/button";
import { getPublicStore, listCatalog } from "@/lib/api/catalog";
import type { CatalogFilters } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] =
    useState<NonNullable<CatalogFilters["sort"]>>("newest");
  const store = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => getPublicStore(slug),
  });
  const products = useInfiniteQuery({
    queryKey: ["store-catalog", store.data?.id, sort],
    initialPageParam: "" as string,
    enabled: Boolean(store.data),
    queryFn: ({ pageParam }) =>
      listCatalog({
        storeId: store.data?.id,
        sort,
        limit: 24,
        cursor: pageParam || undefined,
      }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const items = products.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Beranda
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/products" className="hover:text-primary">
            Produk
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{store.data?.name ?? "Toko"}</span>
        </nav>

        {store.isPending && (
          <div
            role="status"
            className="mt-6 h-32 animate-pulse rounded-lg border bg-muted"
          >
            <span className="sr-only">Memuat toko…</span>
          </div>
        )}
        {store.isError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border bg-white p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {store.error instanceof ApiError && store.error.status === 404
                ? "Toko ini tidak ditemukan atau tidak aktif."
                : "Toko belum dapat dimuat."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void store.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        )}
        {store.data && (
          <>
            <section
              className="mt-6 flex items-start gap-4 rounded-lg border bg-white p-5 sm:p-7"
              aria-labelledby="store-heading"
            >
              <StoreLogo
                name={store.data.name}
                logoUrl={store.data.logoUrl}
                logoAltText={store.data.logoAltText}
                className="size-16"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  Toko aktif
                </p>
                <h1 id="store-heading" className="mt-1 text-2xl font-bold">
                  {store.data.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {store.data.description ||
                    "Jelajahi produk yang tersedia di toko ini."}
                </p>
              </div>
            </section>
            <section aria-labelledby="store-products-heading" className="mt-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="store-products-heading" className="text-xl font-bold">
                    Produk toko
                  </h2>
                  <p
                    aria-live="polite"
                    className="mt-1 text-sm text-muted-foreground"
                  >
                    {products.isPending
                      ? "Memuat produk…"
                      : `Menampilkan ${items.length} produk${products.hasNextPage ? " sejauh ini" : ""}`}
                  </p>
                </div>
                <label
                  htmlFor="store-sort"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  Urutkan
                  <select
                    id="store-sort"
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target.value as NonNullable<
                          CatalogFilters["sort"]
                        >,
                      )
                    }
                    className="min-h-11 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="price_asc">Harga terendah</option>
                    <option value="price_desc">Harga tertinggi</option>
                    <option value="name_asc">Nama A–Z</option>
                  </select>
                </label>
              </div>
              {products.isPending ? (
                <ProductGridSkeleton />
              ) : products.isError ? (
                <CatalogError retry={() => void products.refetch()} />
              ) : items.length === 0 ? (
                <CatalogEmpty message="Toko ini belum memiliki produk aktif." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
              {products.hasNextPage && (
                <div className="mt-7 text-center">
                  <Button
                    variant="outline"
                    disabled={products.isFetchingNextPage}
                    onClick={() => void products.fetchNextPage()}
                  >
                    {products.isFetchingNextPage
                      ? "Memuat…"
                      : "Muat lebih banyak"}
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <MobileDock />
    </div>
  );
}
