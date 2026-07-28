"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getCatalogProduct, formatRupiah } from "@/lib/api/catalog"
import SiteHeader from "@/components/navigation/SiteHeader"
import { MobileDock } from "@/components/navigation/MobileDock"

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const product = useQuery({
    queryKey: ["catalog-product", params.slug],
    queryFn: () => getCatalogProduct(params.slug),
  })
  const data = product.data
  const variant = data?.variants.find((item) => item.id === selectedVariant)
  const price = variant?.priceAmount ?? data?.minPriceAmount

  return (
    <div className="min-h-dvh bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <Link href="/products" className="text-sm text-slate-700 hover:underline">← Kembali ke katalog</Link>
        {product.isPending && <p className="mt-8 text-sm text-slate-600">Memuat produk…</p>}
        {product.isError && <p role="alert" className="mt-8 text-sm text-red-700">Produk tidak ditemukan atau gagal dimuat.</p>}
        {data && (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
                {data.images[selectedImage] ? (
                  <Image src={data.images[selectedImage].url} alt={data.images[selectedImage].alt || data.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">Belum ada foto produk</div>
                )}
              </div>
              {data.images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {data.images.map((image, index) => (
                    <button key={image.url} type="button" onClick={() => setSelectedImage(index)} aria-label={`Lihat foto ${index + 1}`} className={`relative size-16 overflow-hidden rounded-md border ${selectedImage === index ? "border-blue-700" : "border-slate-300"}`}>
                      <Image src={image.url} alt={image.alt || data.name} fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-5 rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-600">{data.category?.name ?? "Produk"} · {data.store.name}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{data.name}</h1>
              <p className="text-3xl font-semibold text-slate-900">{price && formatRupiah(price)}</p>
              <p className="text-sm text-slate-600">{variant ? `Stok ${variant.availableQuantity}` : `Total stok ${data.availableQuantity}`}</p>
              {data.variants.length > 0 && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Pilih varian</legend>
                  <div className="flex flex-wrap gap-2">
                    {data.variants.map((item) => (
                      <button key={item.id} type="button" aria-pressed={selectedVariant === item.id} disabled={item.availableQuantity === 0} onClick={() => setSelectedVariant(item.id)} className={`rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${selectedVariant === item.id ? "border-blue-700 bg-blue-50" : "border-slate-300"}`}>
                        {item.name} · {formatRupiah(item.priceAmount)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="border-t pt-4 text-sm leading-relaxed text-slate-700">{data.description || "Belum ada deskripsi produk."}</div>
              <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">Keranjang dan checkout akan diaktifkan pada tahap berikutnya.</p>
            </div>
          </div>
        )}
      </main>
      <MobileDock />
    </div>
  )
}
