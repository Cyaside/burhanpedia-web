"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  Package,
  ShieldCheck,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface DockItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const commonItems: DockItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/products", label: "Produk", icon: LayoutGrid },
];

export function MobileDock() {
  const pathname = usePathname();
  const user = useCurrentUser().data;
  const roleItems: Record<string, DockItem[]> = {
    BUYER: [
      { href: "/cart", label: "Keranjang", icon: ShoppingCart },
      { href: "/dashboard", label: "Akun", icon: UserRound },
    ],
    SELLER: [
      { href: "/seller/products", label: "Produk saya", icon: Package },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
    DRIVER: [
      { href: "/driver", label: "Pengiriman", icon: Bike },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
    ADMIN: [
      { href: "/admin", label: "Operasional", icon: ShieldCheck },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  };
  const guestItems: DockItem[] = [
    { href: "/cart", label: "Keranjang", icon: ShoppingCart },
    { href: "/login", label: "Masuk", icon: LogIn },
  ];
  const items = [...commonItems, ...(user ? roleItems[user.activeRole] : guestItems)];
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
