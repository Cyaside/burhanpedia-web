"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/products", label: "Produk", icon: LayoutGrid },
  { href: "/cart", label: "Keranjang", icon: ShoppingCart },
  { href: "/profile", label: "Akun", icon: UserRound },
];

export function MobileDock() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama mobile" className="fixed inset-x-0 bottom-0 z-40 border-t bg-white lg:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
