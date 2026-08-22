"use client";

import Link from "next/link";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PackageCheck, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { CatalogProductCard } from "@/components/shop/CatalogProductCard";
import {
  CatalogEmpty,
  CatalogError,
  ProductGridSkeleton,
} from "@/components/shop/CatalogFeedback";
import { HomeDiscovery } from "@/components/shop/HomeDiscovery";
import { StoreCard } from "@/components/shop/StoreCard";
import { Button } from "@/components/ui/button";
import {
  listCatalog,
  listCatalogCategories,
  listPublicStores,
} from "@/lib/api/catalog";
import type { CatalogProduct } from "@/lib/api/catalog";
import { useCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const user = useCurrentUser().data;
  const canBuy = !user || user.activeRole === "BUYER";
  const [newestPage, setNewestPage] = useState(0);
  const [valuePage, setValuePage] = useState(0);
  const [storeStart, setStoreStart] = useState(0);
  const categories = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: listCatalogCategories,
    staleTime: 5 * 60_000,
  });
  const newest = useInfiniteQuery({
    queryKey: ["home-newest"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listCatalog({
        sort: "newest",
        limit: 10,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: (page) => page.nextCursor,
  });
  const value = useInfiniteQuery({
    queryKey: ["home-value"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listCatalog({
        sort: "price_asc",
        limit: 5,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: (page) => page.nextCursor,
  });
  const storeQuery = useQuery({
    queryKey: ["home-stores"],
    queryFn: () => listPublicStores({ limit: 100 }),
    staleTime: 5 * 60_000,
  });
  const stores = circularSample(storeQuery.data?.items ?? [], storeStart, 4);

  async function rotateNewest() {
    if (newestPage + 1 < (newest.data?.pages.length ?? 0))
      return setNewestPage(newestPage + 1);
    if (!newest.hasNextPage) return setNewestPage(0);
    const result = await newest.fetchNextPage();
    setNewestPage(Math.max(0, (result.data?.pages.length ?? 1) - 1));
  }

  async function rotateValue() {
    if (valuePage + 1 < (value.data?.pages.length ?? 0))
      return setValuePage(valuePage + 1);
    if (!value.hasNextPage) return setValuePage(0);
    const result = await value.fetchNextPage();
    setValuePage(Math.max(0, (result.data?.pages.length ?? 1) - 1));
  }

  function rotateStores() {
    const count = storeQuery.data?.items.length ?? 0;
    if (count <= 4) return;
    setStoreStart((current) => {
      const next = Math.floor(Math.random() * count);
      return next === current ? (next + 1) % count : next;
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container space-y-9 pb-24 pt-5 sm:space-y-11 sm:pt-7">
        <h1 className="sr-only">
          Burhanpedia — marketplace untuk kebutuhan sehari-hari
        </h1>
        <HomeDiscovery
          categories={categories.data?.filter((category) => !category.parentId)}
          categoriesLoading={categories.isPending}
          categoriesError={categories.isError}
          canBuy={canBuy}
        />

        <ProductSection
          id="terbaru"
          title="Produk terbaru"
          description="Pilihan yang baru hadir di katalog."
          products={newest.data?.pages[newestPage]?.items}
          loading={newest.isPending}
          error={newest.isError}
          retry={() => void newest.refetch()}
          refresh={
            newest.hasNextPage || (newest.data?.pages.length ?? 0) > 1
              ? () => void rotateNewest()
              : undefined
          }
          refreshing={newest.isFetchingNextPage}
        />

        <div
          className="grid gap-3 border-y py-5 text-sm sm:grid-cols-3"
          aria-label="Informasi belanja"
        >
          <ValuePoint
            icon={PackageCheck}
            title="Pilihan jelas"
            text="Harga dan stok tampil sebelum checkout."
          />
          <ValuePoint
            icon={ShieldCheck}
            title="Ringkasan transparan"
            text="Rincian biaya dihitung di server."
          />
          <ValuePoint
            icon={Truck}
            title="Pengiriman terlacak"
            text="Perubahan status tercatat di pesanan."
          />
        </div>

        <ProductSection
          id="harga-pilihan"
          title="Mulai dari harga terendah"
          description="Bandingkan pilihan sesuai kebutuhanmu."
          products={value.data?.pages[valuePage]?.items}
          loading={value.isPending}
          error={value.isError}
          retry={() => void value.refetch()}
          refresh={
            value.hasNextPage || (value.data?.pages.length ?? 0) > 1
              ? () => void rotateValue()
              : undefined
          }
          refreshing={value.isFetchingNextPage}
        />

        {!storeQuery.isPending && stores.length > 0 && (
          <section id="toko" aria-labelledby="store-heading">
            <SectionHeading
              id="store-heading"
              title="Jelajahi toko"
              href="/stores"
              refresh={rotateStores}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}
      </main>
      <footer id="bantuan" className="border-t bg-white pb-20 lg:pb-0">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Burhanpedia</span>
          <nav aria-label="Tautan bawah" className="flex gap-5">
            <Link href="/products" className="hover:text-primary">
              Produk
            </Link>
            {canBuy && (
              <Link href={user ? "/profile" : "/login"} className="hover:text-primary">
                Pesanan saya
              </Link>
            )}
          </nav>
        </div>
      </footer>
      <MobileDock />
    </div>
  );
}

function SectionHeading({
  id,
  title,
  href,
  refresh,
  refreshing = false,
}: {
  id: string;
  title: string;
  href: string;
  refresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 id={id} className="min-w-0 text-xl font-bold">
        {title}
      </h2>
      <div className="flex shrink-0 items-center gap-2">
        {refresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Pilihan lain
          </Button>
        )}
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          Lihat semua
        </Link>
      </div>
    </div>
  );
}

function ProductSection({
  id,
  title,
  description,
  products,
  loading,
  error,
  retry,
  refresh,
  refreshing,
}: {
  id: string;
  title: string;
  description: string;
  products?: CatalogProduct[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  refresh?: () => void;
  refreshing: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <SectionHeading
        id={`${id}-heading`}
        title={title}
        href="/products"
        refresh={refresh}
        refreshing={refreshing}
      />
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {loading ? (
        <ProductGridSkeleton count={5} />
      ) : error ? (
        <CatalogError retry={retry} />
      ) : products?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <CatalogEmpty message="Belum ada produk yang tersedia." />
      )}
    </section>
  );
}

function ValuePoint({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof PackageCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-primary"
      />
      <div>
        <strong>{title}</strong>
        <p className="mt-1 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function circularSample<T>(items: T[], start: number, count: number): T[] {
  if (items.length <= count) return items;
  return Array.from(
    { length: count },
    (_, index) => items[(start + index) % items.length],
  );
}
