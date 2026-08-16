"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { StoreCard } from "@/components/shop/StoreCard";
import { Button } from "@/components/ui/button";
import { listPublicStores } from "@/lib/api/catalog";

export default function StoresPage() {
  const stores = useInfiniteQuery({
    queryKey: ["public-stores"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listPublicStores({ cursor: pageParam ?? undefined, limit: 24 }),
    getNextPageParam: (page) => page.nextCursor,
  });
  const items = stores.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-7">
        <div className="flex items-start gap-3">
          <Store aria-hidden="true" className="mt-1 size-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Jelajahi toko</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Temukan etalase seller aktif dan produk yang mereka tawarkan.
            </p>
          </div>
        </div>

        {stores.isPending ? (
          <div
            role="status"
            className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-lg border bg-muted"
              />
            ))}
          </div>
        ) : stores.isError ? (
          <div
            role="alert"
            className="mt-7 rounded-lg border bg-white p-5 text-sm"
          >
            Toko belum dapat dimuat.
            <Button
              variant="outline"
              className="ml-3"
              onClick={() => void stores.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="mt-7 rounded-lg border bg-white p-5 text-sm text-muted-foreground">
            Belum ada toko aktif.
          </p>
        ) : (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
            {stores.hasNextPage && (
              <div className="mt-7 text-center">
                <Button
                  variant="outline"
                  disabled={stores.isFetchingNextPage}
                  onClick={() => void stores.fetchNextPage()}
                >
                  {stores.isFetchingNextPage ? "Memuat…" : "Muat toko lainnya"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <MobileDock />
    </div>
  );
}
