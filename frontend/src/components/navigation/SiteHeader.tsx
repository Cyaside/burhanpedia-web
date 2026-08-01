"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Search, ShoppingCart, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listCatalogCategories } from "@/lib/api/catalog";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const categories = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: listCatalogCategories,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(() => { if (active) setHasSession(true); })
      .catch(() => { if (active) setHasSession(false); });
    return () => { active = false; };
  }, [pathname]);

  function searchProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="hidden border-b bg-background text-xs text-muted-foreground lg:block">
        <div className="page-container flex min-h-8 items-center justify-between">
          <span>Belanja dari berbagai toko di satu tempat</span>
          <nav aria-label="Tautan bantuan" className="flex items-center gap-6">
            <Link href="/#bantuan" className="hover:text-primary"><HelpCircle aria-hidden="true" className="mr-1 inline size-3.5" />Bantuan</Link>
            <Link href={hasSession ? "/profile" : "/login"} className="hover:text-primary">Status pesanan</Link>
            <Link href={hasSession ? "/dashboard" : "/login"} className="hover:text-primary">Akun & peran</Link>
          </nav>
        </div>
      </div>

      <div className="page-container grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 py-3 md:grid-cols-[190px_minmax(0,1fr)_auto] md:gap-x-6">
        <Link href="/" className="inline-flex w-fit items-center" aria-label="Beranda Burhanpedia">
          <Image src="/brand-wordmark.svg" alt="Burhanpedia" width={190} height={43} priority className="h-10 w-auto" />
        </Link>

        <form onSubmit={searchProducts} role="search" className="order-3 col-span-2 flex min-w-0 md:order-none md:col-span-1">
          <label htmlFor="site-search" className="sr-only">Cari produk</label>
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari produk di Burhanpedia"
            className="h-11 min-w-0 flex-1 rounded-l-md border border-r-0 border-input bg-white px-3 text-sm placeholder:text-muted-foreground focus-visible:relative"
          />
          <Button type="submit" className="rounded-l-none px-4" aria-label="Cari produk">
            <Search aria-hidden="true" className="size-5" />
            <span className="hidden lg:inline">Cari</span>
          </Button>
        </form>

        <nav aria-label="Akun dan keranjang" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Keranjang">
            <Link href="/cart"><ShoppingCart aria-hidden="true" className="size-5" /><span className="sr-only">Keranjang</span></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={hasSession ? "Akun saya" : "Masuk"}>
            <Link href={hasSession ? "/profile" : "/login"}><UserRound aria-hidden="true" className="size-5" /><span className="sr-only">{hasSession ? "Akun saya" : "Masuk"}</span></Link>
          </Button>
        </nav>
      </div>

      <nav aria-label="Kategori produk" className="border-t">
        <div className="page-container flex min-h-11 items-center gap-6 overflow-x-auto whitespace-nowrap text-sm font-medium">
          <Link href="/products" className="text-primary hover:underline">Semua produk</Link>
          {categories.data?.filter((category) => !category.parentId).slice(0, 7).map((category) => (
            <Link key={category.id} href={`/products?categoryId=${category.id}`} className="text-muted-foreground hover:text-primary">
              {category.name}
            </Link>
          ))}
          <Link href="/#toko" className="text-muted-foreground hover:text-primary">Jelajahi toko</Link>
        </div>
      </nav>
    </header>
  );
}
