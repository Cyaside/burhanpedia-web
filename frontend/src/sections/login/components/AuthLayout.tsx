import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Store, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

const benefits = [
  { icon: Store, text: "Jelajahi produk dari berbagai toko" },
  { icon: ShieldCheck, text: "Harga dan rincian pesanan ditampilkan jelas" },
  { icon: Truck, text: "Pantau proses pengiriman di satu tempat" },
];

export default function AuthLayout({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="page-container grid min-h-dvh gap-8 py-8 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Beranda Burhanpedia">
            <Image src="/brand-mark.svg" alt="" width={52} height={52} />
            <span className="text-2xl font-bold">Burhanpedia</span>
          </Link>
          <h1 className="mt-10 max-w-lg text-4xl font-bold leading-tight">{heading}</h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">{subheading}</p>
          <ul className="mt-10 space-y-5 border-t pt-7">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Icon aria-hidden="true" className="size-5 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </section>
        <section className="w-full max-w-md justify-self-center lg:max-w-none" aria-label="Form akun">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden" aria-label="Beranda Burhanpedia">
            <Image src="/brand-mark.svg" alt="" width={40} height={40} />
            <span className="text-lg font-bold">Burhanpedia</span>
          </Link>
          <Card>{children}</Card>
        </section>
      </div>
    </main>
  );
}
