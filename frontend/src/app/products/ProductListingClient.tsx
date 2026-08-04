"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { CatalogProductCard } from "@/components/shop/CatalogProductCard";
import {
  CatalogEmpty,
  CatalogError,
  ProductGridSkeleton,
} from "@/components/shop/CatalogFeedback";
import { listCatalog, listCatalogCategories } from "@/lib/api/catalog";
import type { CatalogCategory, CatalogFilters } from "@/lib/api/catalog";
import { Button } from "@/components/ui/button";
import { MobileDock } from "@/components/navigation/MobileDock";
import SiteHeader from "@/components/navigation/SiteHeader";

const sorts: Array<{
  value: NonNullable<CatalogFilters["sort"]>;
  label: string;
}> = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
  { value: "name_asc", label: "Nama A–Z" },
];

export default function ProductListingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const minPrice = validPrice(searchParams.get("minPrice"));
  const maxPrice = validPrice(searchParams.get("maxPrice"));
  const minRating = validRating(searchParams.get("minRating"));
  const requestedSort = searchParams.get("sort");
  const sort =
    sorts.find(({ value }) => value === requestedSort)?.value ?? "newest";
  const categories = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: listCatalogCategories,
    staleTime: 5 * 60_000,
  });
  const products = useInfiniteQuery({
    queryKey: ["catalog", q, categoryId, minPrice, maxPrice, minRating, sort],
    initialPageParam: "" as string,
    queryFn: ({ pageParam }) =>
      listCatalog({
        q: q.length >= 2 ? q : undefined,
        categoryId: categoryId || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        sort,
        limit: 24,
        cursor: pageParam || undefined,
      }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });

  function navigate(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/products${params.size ? `?${params}` : ""}`);
  }

  const items = products.data?.pages.flatMap((page) => page.items) ?? [];
  const categoryName = categories.data?.find(
    (category) => category.id === categoryId,
  )?.name;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Beranda
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Produk</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {q.length >= 2
                ? `Hasil untuk “${q}”`
                : (categoryName ?? "Jelajahi produk")}
            </h1>
            <p
              aria-live="polite"
              className="mt-1 text-sm text-muted-foreground"
            >
              {products.isPending
                ? "Mencari produk…"
                : `Menampilkan ${items.length} produk${products.hasNextPage ? " sejauh ini" : ""}`}
            </p>
            {q.length === 1 && (
              <p className="mt-1 text-xs text-promo">
                Gunakan minimal dua karakter untuk pencarian.
              </p>
            )}
          </div>
          <label
            htmlFor="catalog-sort"
            className="flex items-center gap-2 text-sm font-medium"
          >
            Urutkan
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) => navigate({ sort: event.target.value })}
              className="min-h-11 rounded-md border border-input bg-white px-3 text-sm"
            >
              {sorts.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 lg:hidden">
          <details className="rounded-lg border bg-white">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold">
              <SlidersHorizontal aria-hidden="true" className="size-4" /> Filter
              produk
            </summary>
            <div className="border-t p-4">
              <FilterPanel
                key={`mobile-${searchParams.toString()}`}
                idPrefix="mobile"
                categories={categories.data ?? []}
                values={{ categoryId, minPrice, maxPrice, minRating }}
                onApply={navigate}
              />
            </div>
          </details>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside
            aria-label="Filter produk"
            className="hidden h-fit rounded-lg border bg-white p-4 lg:block"
          >
            <h2 className="mb-4 font-semibold">Filter</h2>
            <FilterPanel
              key={`desktop-${searchParams.toString()}`}
              idPrefix="desktop"
              categories={categories.data ?? []}
              values={{ categoryId, minPrice, maxPrice, minRating }}
              onApply={navigate}
            />
          </aside>
          <section aria-label="Daftar produk" className="min-w-0">
            {products.isPending ? (
              <ProductGridSkeleton />
            ) : products.isError ? (
              <CatalogError retry={() => void products.refetch()} />
            ) : items.length === 0 ? (
              <CatalogEmpty />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
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
        </div>
      </main>
      <MobileDock />
    </div>
  );
}

function FilterPanel({
  idPrefix,
  categories,
  values,
  onApply,
}: {
  idPrefix: string;
  categories: CatalogCategory[];
  values: {
    categoryId: string;
    minPrice: string;
    maxPrice: string;
    minRating: number | null;
  };
  onApply: (next: Record<string, string>) => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const min = String(form.get("minPrice") ?? "");
    const max = String(form.get("maxPrice") ?? "");
    if (min && max && BigInt(min) > BigInt(max)) {
      setError("Harga minimum tidak boleh melebihi maksimum.");
      return;
    }
    setError("");
    onApply({
      categoryId: String(form.get("categoryId") ?? ""),
      minPrice: min,
      maxPrice: max,
      minRating: String(form.get("minRating") ?? ""),
    });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <label
        htmlFor={`${idPrefix}-category`}
        className="block text-sm font-medium"
      >
        Kategori
        <select
          id={`${idPrefix}-category`}
          name="categoryId"
          defaultValue={values.categoryId}
          className="mt-2 min-h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Rentang harga</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label
            htmlFor={`${idPrefix}-min`}
            className="text-xs text-muted-foreground"
          >
            Minimum
            <input
              id={`${idPrefix}-min`}
              name="minPrice"
              type="number"
              min="0"
              max="999999999999999"
              inputMode="numeric"
              placeholder="Rp 0"
              defaultValue={values.minPrice}
              className="mt-1 min-h-11 w-full rounded-md border border-input bg-white px-2 text-sm"
            />
          </label>
          <label
            htmlFor={`${idPrefix}-max`}
            className="text-xs text-muted-foreground"
          >
            Maksimum
            <input
              id={`${idPrefix}-max`}
              name="maxPrice"
              type="number"
              min="0"
              max="999999999999999"
              inputMode="numeric"
              placeholder="Bebas"
              defaultValue={values.maxPrice}
              className="mt-1 min-h-11 w-full rounded-md border border-input bg-white px-2 text-sm"
            />
          </label>
        </div>
      </fieldset>
      <label
        htmlFor={`${idPrefix}-rating`}
        className="block text-sm font-medium"
      >
        Rating minimum
        <select
          id={`${idPrefix}-rating`}
          name="minRating"
          defaultValue={values.minRating ?? ""}
          className="mt-2 min-h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Semua rating</option>
          {[4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} bintang ke atas
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-xs text-promo">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Terapkan
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onApply({
              categoryId: "",
              minPrice: "",
              maxPrice: "",
              minRating: "",
            })
          }
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

function validPrice(value: string | null) {
  return value && /^[0-9]{1,15}$/.test(value) ? value : "";
}

function validRating(value: string | null) {
  const number = Number(value);
  return value && Number.isInteger(number) && number >= 1 && number <= 5
    ? number
    : null;
}
