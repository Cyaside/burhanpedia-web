import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { CatalogProduct } from "@/lib/api/catalog";
import { formatRupiah } from "@/lib/api/catalog";

export function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const image = product.images[0];
  const productHref = `/products/${product.id}`;
  return (
    <article className="group overflow-hidden rounded-lg border bg-white transition-colors hover:border-input">
      <Link href={productHref} aria-label={`Lihat ${product.name}`} className="block focus-visible:outline-2 focus-visible:outline-ring">
        <div className="relative aspect-square bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">Foto belum tersedia</div>
          )}
        </div>
      </Link>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">
          <Link href={productHref} className="hover:text-primary hover:underline">{product.name}</Link>
        </h3>
        <p className="text-base font-bold">{formatRupiah(product.minPriceAmount)}</p>
        <Link href={`/stores/${product.store.slug}`} className="flex min-h-11 items-center truncate text-xs text-muted-foreground hover:text-primary hover:underline">
          {product.store.name}
        </Link>
        <div className="flex min-h-5 items-center gap-1 text-xs text-muted-foreground">
          {product.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1" aria-label={`Rating ${product.ratingAverage.toFixed(1)} dari ${product.ratingCount} ulasan`}>
              <Star aria-hidden="true" className="size-3.5 fill-brand-yellow text-brand-yellow" />
              {product.ratingAverage.toFixed(1)}
            </span>
          )}
          {product.ratingCount > 0 && <span aria-hidden="true">·</span>}
          <span className={product.availableQuantity > 0 ? "" : "text-promo"}>
            {product.availableQuantity > 0 ? "Tersedia" : "Stok habis"}
          </span>
        </div>
      </div>
    </article>
  );
}
