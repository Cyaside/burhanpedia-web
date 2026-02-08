 "use client"

 import Link from "next/link"
 import { usePathname } from "next/navigation"
 import { Heart, Home, Search, ShoppingCart, UserRound } from "lucide-react"
 import { cn } from "@/lib/utils"

 const items = [
   { href: "/", label: "Home", icon: Home },
   { href: "/products", label: "Search", icon: Search },
   { href: "/cart", label: "Cart", icon: ShoppingCart },
   { href: "/wishlist", label: "Wishlist", icon: Heart },
   { href: "/profile", label: "Profile", icon: UserRound },
 ]

 export function MobileDock() {
   const pathname = usePathname()

   return (
     <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur lg:hidden">
       <div className="mx-auto grid max-w-3xl grid-cols-5">
         {items.map((item) => {
           const active = pathname === item.href || pathname.startsWith(item.href + "/")
           const Icon = item.icon
           return (
             <Link
               key={item.href}
               href={item.href}
               className={cn(
                 "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                 active ? "text-primary" : "text-muted-foreground"
               )}
             >
               <Icon className="size-4" />
               {item.label}
             </Link>
           )
         })}
       </div>
     </nav>
   )
 }

