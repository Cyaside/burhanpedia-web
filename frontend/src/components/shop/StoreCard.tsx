import Link from "next/link";
import { Star } from "lucide-react";
import type { PublicStore } from "@/lib/api/catalog";
import { StoreLogo } from "@/components/shop/StoreLogo";

export function StoreCard({ store }: { store: PublicStore }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex min-h-24 items-center gap-4 rounded-lg border bg-white p-4 transition-colors hover:border-primary"
    >
      <StoreLogo
        name={store.name}
        logoUrl={store.logoUrl}
        logoAltText={store.logoAltText}
      />
      <span className="min-w-0">
        <strong className="block truncate text-sm">{store.name}</strong>
        <span className="mt-1 block text-xs text-muted-foreground">
          {store.productCount} produk
          {store.ratingCount > 0 && (
            <>
              {" · "}
              <Star
                aria-hidden="true"
                className="inline size-3 fill-warning text-warning"
              />{" "}
              {store.ratingAverage.toFixed(1)}
            </>
          )}
        </span>
        <span className="mt-1 block text-xs font-semibold text-primary">
          Lihat etalase
        </span>
      </span>
    </Link>
  );
}
