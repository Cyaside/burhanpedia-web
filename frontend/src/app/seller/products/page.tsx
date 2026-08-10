"use client";

import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/api/catalog";
import { sellerApi, type SellerProduct } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import { useAuthGuard } from "@/lib/auth";

export default function SellerProductsPage() {
  const { user, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const store = useQuery({
    queryKey: ["seller-store"],
    queryFn: sellerApi.store,
    enabled: user?.activeRole === "SELLER",
  });
  const products = useInfiniteQuery({
    queryKey: ["seller-products"],
    queryFn: ({ pageParam }) => sellerApi.products(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: user?.activeRole === "SELLER",
  });
  const publication = useMutation({
    mutationFn: ({ product, status }: { product: SellerProduct; status: SellerProduct["status"] }) =>
      sellerApi.updateProduct(product.id, { version: product.version, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-products"] }),
  });

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") return <SellerRoleRequired />;

  const items = products.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pusat seller</p>
            <h1 className="mt-1 text-3xl font-bold">Produk toko</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola publikasi, varian, stok, dan foto produk dari satu tempat.
            </p>
          </div>
          <Button asChild>
            <Link href={store.data ? "/seller/products/new" : "/seller/store"}>
              <PackagePlus aria-hidden="true" />
              {store.data ? "Tambah produk" : "Buat toko"}
            </Link>
          </Button>
        </div>
        <SellerNavigation />

        {store.isError && store.error instanceof ApiError && store.error.status === 404 && (
          <p className="mt-8 rounded-lg border bg-white p-5 text-sm">
            Toko belum dibuat. <Link href="/seller/store" className="font-semibold text-primary hover:underline">Buat toko</Link> sebelum menambahkan produk.
          </p>
        )}
        {store.isError && !(store.error instanceof ApiError && store.error.status === 404) && (
          <p role="alert" className="mt-8 text-sm text-destructive">{store.error.message}</p>
        )}

        {products.isPending && <p className="mt-8 text-sm">Memuat produk…</p>}
        {products.isError && (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {products.error.message}
          </p>
        )}
        {!products.isPending && items.length === 0 && Boolean(store.data) && (
          <section className="mt-8 border-y py-12 text-center">
            <h2 className="text-lg font-bold">Belum ada produk</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Buat produk pertama beserta minimal satu varian dan stok awal.
            </p>
          </section>
        )}
        {items.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-lg border bg-white">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_9rem_8rem_10rem] gap-4 border-b bg-muted px-5 py-3 text-xs font-semibold text-muted-foreground md:grid">
              <span>Produk</span>
              <span>Harga mulai</span>
              <span>Status</span>
              <span className="text-right">Tindakan</span>
            </div>
            {items.map((product) => (
              <article
                key={product.id}
                className="grid gap-4 border-b p-5 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_9rem_8rem_10rem] md:items-center"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{product.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.variants.length} varian · {product.variants.reduce((total, item) => total + item.availableQuantity, 0)} stok tersedia
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {product.minPriceAmount ? formatRupiah(product.minPriceAmount) : "Belum tersedia"}
                </p>
                <StatusLabel status={product.status} />
                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/seller/products/${product.id}`}>Kelola</Link>
                  </Button>
                  {product.status !== "ACTIVE" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={publication.isPending}
                      onClick={() => publication.mutate({ product, status: "ACTIVE" })}
                    >
                      Aktifkan
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={publication.isPending}
                      onClick={() => publication.mutate({ product, status: "ARCHIVED" })}
                    >
                      Arsipkan
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {publication.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {publication.error.message}
          </p>
        )}
        {products.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            disabled={products.isFetchingNextPage}
            onClick={() => void products.fetchNextPage()}
          >
            {products.isFetchingNextPage ? "Memuat…" : "Muat produk lainnya"}
          </Button>
        )}
      </main>
    </div>
  );
}

function StatusLabel({ status }: { status: SellerProduct["status"] }) {
  const label = status === "ACTIVE" ? "Aktif" : status === "DRAFT" ? "Draf" : "Diarsipkan";
  return (
    <span className={status === "ACTIVE" ? "text-sm font-semibold text-success" : "text-sm font-semibold text-muted-foreground"}>
      {label}
    </span>
  );
}

function SellerRoleRequired() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">Aktifkan peran seller</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ganti peran aktif ke SELLER untuk mengelola produk toko.
      </p>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Kembali ke dashboard</Link>
      </Button>
    </main>
  );
}
