"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/seller/products", label: "Produk" },
  { href: "/seller/orders", label: "Pesanan" },
  { href: "/seller/finance", label: "Keuangan" },
  { href: "/seller/store", label: "Identitas toko" },
];

export function SellerNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi seller"
      className="mt-6 flex gap-1 overflow-x-auto border-b"
    >
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
