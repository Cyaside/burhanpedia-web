"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PackageCheck, ShieldCheck, Store, Truck } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { MobileDock } from "@/components/navigation/MobileDock";
import { CatalogProductCard } from "@/components/shop/CatalogProductCard";
import { CatalogEmpty, CatalogError, ProductGridSkeleton } from "@/components/shop/CatalogFeedback";
import { listCatalog, listCatalogCategories } from "@/lib/api/catalog";
import type { CatalogProduct } from "@/lib/api/catalog";

export default function HomePage() {
  const categories = useQuery({ queryKey: ["catalog-categories"], queryFn: listCatalogCategories, staleTime: 5 * 60_000 });
  const newest = useQuery({ queryKey: ["home-newest"], queryFn: () => listCatalog({ sort: "newest", limit: 10 }) });
  const value = useQuery({ queryKey: ["home-value"], queryFn: () => listCatalog({ sort: "price_asc", limit: 5 }) });
  const stores = uniqueStores(newest.data?.items ?? []);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container space-y-9 pb-24 pt-5 sm:space-y-11 sm:pt-7">
        <section className="grid gap-4 border bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7" aria-labelledby="home-heading">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Belanja di Burhanpedia</p>
            <h1 id="home-heading" className="mt-2 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
              Temukan produk yang kamu butuhkan, tanpa ribet.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Jelajahi pilihan dari berbagai toko dan lihat harga serta stok sebelum membeli.</p>
          </div>
          <Link href="/products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Jelajahi produk <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <section aria-labelledby="category-heading">
          <SectionHeading id="category-heading" title="Cari berdasarkan kategori" href="/products" />
          {categories.isPending ? (
            <div role="status" aria-label="Memuat kategori" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg border bg-muted" />)}
            </div>
          ) : categories.isError ? (
            <p role="alert" className="text-sm text-muted-foreground">Kategori belum dapat dimuat. Kamu tetap bisa melihat semua produk.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categories.data.filter((category) => !category.parentId).slice(0, 6).map((category) => (
                <Link key={category.id} href={`/products?categoryId=${category.id}`} className="flex min-h-16 items-center justify-center rounded-lg border bg-white px-3 text-center text-sm font-semibold hover:border-primary hover:text-primary">
                  {category.name}
                </Link>
              ))}
              {categories.data.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Kategori belum tersedia.</p>}
            </div>
          )}
        </section>

        <ProductSection
          id="terbaru"
          title="Produk terbaru"
          description="Pilihan yang baru hadir di katalog."
          products={newest.data?.items}
          loading={newest.isPending}
          error={newest.isError}
          retry={() => void newest.refetch()}
        />

        <div className="grid gap-3 border-y py-5 text-sm sm:grid-cols-3" aria-label="Informasi belanja">
          <ValuePoint icon={PackageCheck} title="Pilihan jelas" text="Harga dan stok tampil sebelum checkout." />
          <ValuePoint icon={ShieldCheck} title="Ringkasan transparan" text="Rincian biaya dihitung di server." />
          <ValuePoint icon={Truck} title="Pengiriman terlacak" text="Perubahan status tercatat di pesanan." />
        </div>

        <ProductSection
          id="harga-pilihan"
          title="Mulai dari harga terendah"
          description="Bandingkan pilihan sesuai kebutuhanmu."
          products={value.data?.items}
          loading={value.isPending}
          error={value.isError}
          retry={() => void value.refetch()}
        />

        {stores.length > 0 && (
          <section id="toko" aria-labelledby="store-heading">
            <SectionHeading id="store-heading" title="Jelajahi toko" href="/products" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stores.map((store) => (
                <Link key={store.id} href={`/stores/${store.slug}`} className="flex min-h-20 items-center gap-3 rounded-lg border bg-white p-4 hover:border-primary">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-primary"><Store aria-hidden="true" className="size-5" /></span>
                  <span className="min-w-0"><strong className="block truncate text-sm">{store.name}</strong><span className="text-xs text-muted-foreground">Lihat etalase toko</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer id="bantuan" className="border-t bg-white pb-20 lg:pb-0">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Burhanpedia</span>
          <nav aria-label="Tautan bawah" className="flex gap-5"><Link href="/products" className="hover:text-primary">Produk</Link><Link href="/profile" className="hover:text-primary">Pesanan saya</Link></nav>
        </div>
      </footer>
      <MobileDock />
    </div>
  );
}

function SectionHeading({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 id={id} className="text-xl font-bold">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">Lihat semua</Link>
    </div>
  );
}

function ProductSection({ id, title, description, products, loading, error, retry }: {
  id: string; title: string; description: string; products?: CatalogProduct[]; loading: boolean; error: boolean; retry: () => void;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <SectionHeading id={`${id}-heading`} title={title} href="/products" />
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {loading ? <ProductGridSkeleton count={5} /> : error ? <CatalogError retry={retry} /> : products?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => <CatalogProductCard key={product.id} product={product} />)}
        </div>
      ) : <CatalogEmpty message="Belum ada produk yang tersedia." />}
    </section>
  );
}

function ValuePoint({ icon: Icon, title, text }: { icon: typeof PackageCheck; title: string; text: string }) {
  return <div className="flex items-start gap-3"><Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" /><div><strong>{title}</strong><p className="mt-1 text-muted-foreground">{text}</p></div></div>;
}

function uniqueStores(products: CatalogProduct[]) {
  return [...new Map(products.map((product) => [product.store.id, product.store])).values()].slice(0, 4);
}
