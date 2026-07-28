import Link from "next/link"
import Image from "next/image"
import type { CatalogProduct } from "@/lib/api/catalog"
import { formatRupiah } from "@/lib/api/catalog"

export function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const image = product.images[0]
  return (
    <Link href={`/products/${product.id}`} className="group overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        {image ? (
          <Image src={image.url} alt={image.alt || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Belum ada foto</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-medium text-slate-900">{product.name}</p>
        <p className="font-semibold text-slate-900">{formatRupiah(product.minPriceAmount)}</p>
        <p className="truncate text-xs text-slate-600">{product.store.name}</p>
        <p className="text-xs text-slate-600">{product.availableQuantity > 0 ? `Stok ${product.availableQuantity}` : "Stok habis"}</p>
      </div>
    </Link>
  )
}
