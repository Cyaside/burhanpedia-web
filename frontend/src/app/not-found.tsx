import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/navigation/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container flex flex-col items-center py-20 text-center">
        <Image src="/brand-mark.svg" alt="" width={72} height={72} />
        <p className="mt-6 text-sm font-semibold text-primary">Halaman tidak ditemukan</p>
        <h1 className="mt-2 text-3xl font-bold">Sepertinya alamatnya keliru</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Halaman yang kamu cari tidak tersedia. Kembali ke beranda atau jelajahi produk.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/">Ke beranda</Link></Button>
          <Button asChild variant="outline"><Link href="/products">Lihat produk</Link></Button>
        </div>
      </main>
    </div>
  );
}
