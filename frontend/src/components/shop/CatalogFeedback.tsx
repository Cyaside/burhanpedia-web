import { Button } from "@/components/ui/button";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-label="Memuat produk" role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border bg-white">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Memuat produk…</span>
    </div>
  );
}

export function CatalogEmpty({ message = "Belum ada produk yang cocok." }: { message?: string }) {
  return <p className="rounded-lg border bg-white px-5 py-10 text-center text-sm text-muted-foreground">{message}</p>;
}

export function CatalogError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border bg-white px-5 py-8 text-center">
      <p className="text-sm text-muted-foreground">Produk belum dapat dimuat. Periksa koneksi lalu coba lagi.</p>
      <Button type="button" variant="outline" onClick={retry} className="mt-4">Coba lagi</Button>
    </div>
  );
}
