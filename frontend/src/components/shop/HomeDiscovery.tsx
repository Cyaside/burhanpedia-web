import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogCategory } from "@/lib/api/catalog";
import {
  categoryVisuals,
  quickShoppingLinks,
  storefrontHero,
  storefrontPromotions,
} from "@/lib/marketplace-content";

interface HomeDiscoveryProps {
  categories?: CatalogCategory[];
  categoriesLoading: boolean;
  categoriesError: boolean;
  canBuy: boolean;
}

export function HomeDiscovery({ categories, categoriesLoading, categoriesError, canBuy }: HomeDiscoveryProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]" aria-label="Promosi Burhanpedia">
        <Link
          href="/products?sort=newest"
          className="group grid min-h-[330px] overflow-hidden rounded-xl border bg-primary text-white md:grid-cols-[minmax(280px,0.85fr)_1.15fr]"
        >
          <span className="flex flex-col justify-center p-6 sm:p-8">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-white">Pilihan toko lokal</span>
            <span className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Produk baru untuk kebutuhan sehari-hari.</span>
            <span className="mt-3 max-w-md text-sm leading-6 text-white">
              Temukan katalog terbaru, cek stok, lalu lanjutkan belanja tanpa berpindah halaman.
            </span>
            <span className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-primary group-hover:bg-accent">
              Lihat produk terbaru <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </span>
          <span className="relative min-h-56 md:min-h-full">
            <Image
              src={storefrontHero.image}
              alt={storefrontHero.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
          </span>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {storefrontPromotions.map((promotion) => (
            <Link
              key={promotion.categorySlug}
              href={resolveCategoryHref(categories, promotion.categorySlug, promotion.fallbackQuery)}
              className="group grid min-h-40 grid-cols-[minmax(0,1fr)_42%] overflow-hidden rounded-xl border bg-white hover:border-primary"
            >
              <span className="flex flex-col justify-center p-4 sm:p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{promotion.eyebrow}</span>
                <strong className="mt-1 text-base leading-snug sm:text-lg">{promotion.title}</strong>
                <span className="mt-2 text-xs leading-5 text-muted-foreground">{promotion.description}</span>
                <span className="mt-3 text-xs font-bold text-primary group-hover:underline">Belanja sekarang</span>
              </span>
              <span className="relative min-h-full bg-muted">
                <Image
                  src={promotion.image}
                  alt={promotion.alt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 15vw"
                  className="object-cover"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="Jalur belanja cepat" className="grid overflow-hidden rounded-lg border bg-white sm:grid-cols-2 lg:grid-cols-4">
        {quickShoppingLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href === "/cart" && !canBuy ? "/stores" : item.href}
            className="flex min-h-12 items-center justify-between border-b px-4 text-sm font-semibold hover:bg-accent hover:text-primary sm:border-r lg:border-b-0 last:border-b-0 sm:[&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r"
          >
            {item.href === "/cart" && !canBuy ? "Jelajahi toko" : item.label}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ))}
      </nav>

      <section aria-labelledby="category-heading" className="pt-2">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id="category-heading" className="text-xl font-bold">Belanja berdasarkan kategori</h2>
            <p className="mt-1 text-sm text-muted-foreground">Masuk langsung ke jenis produk yang kamu cari.</p>
          </div>
          <Link href="/products" className="shrink-0 text-sm font-semibold text-primary hover:underline">Semua produk</Link>
        </div>

        {categoriesLoading ? (
          <div role="status" aria-label="Memuat kategori" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoryVisuals.map((category) => <div key={category.slug} className="aspect-[4/3] animate-pulse rounded-lg border bg-muted" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoryVisuals.map((visual) => {
              const category = categories?.find((item) => item.slug === visual.slug);
              return (
                <Link
                  key={visual.slug}
                  href={resolveCategoryHref(categories, visual.slug, visual.fallbackName)}
                  className="group overflow-hidden rounded-lg border bg-white hover:border-primary"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={visual.image}
                      alt={visual.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  </span>
                  <strong className="flex min-h-12 items-center px-3 text-sm group-hover:text-primary">
                    {category?.name ?? visual.fallbackName}
                  </strong>
                </Link>
              );
            })}
          </div>
        )}
        {categoriesError && <p role="status" className="mt-3 text-xs text-muted-foreground">Kategori ditampilkan dari navigasi cadangan sementara katalog dimuat ulang.</p>}
      </section>
    </div>
  );
}

function resolveCategoryHref(categories: CatalogCategory[] | undefined, slug: string, fallbackQuery: string) {
  const category = categories?.find((item) => item.slug === slug);
  return category ? `/products?categoryId=${category.id}` : `/products?q=${encodeURIComponent(fallbackQuery)}`;
}
