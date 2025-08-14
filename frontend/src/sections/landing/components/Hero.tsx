import Image from "next/image"
import React from "react"
import { toast } from "sonner"
import { ArrowRight, BadgePercent, CreditCard, Filter, Search, Truck } from "lucide-react"

import AnimatedBadge from "@/sections/landing/components/AnimatedBadge"
import { Button } from "@/components/ui/button"

export default function Hero() {
  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = (formData.get("q") as string) || ""
    toast.success("Search initiated", { description: query ? `Looking for: ${query}` : "We will add results soon." })
  }

  return (
    <section className="mx-auto flex flex-1 max-w-6xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/burhan.jpg"
          alt="BurhanPedia logo"
          width={56}
          height={56}
          className="rounded-full shadow-sm ring-1 ring-border"
          priority
        />
        <AnimatedBadge text="Smart deals, smarter shopping" colorClass="bg-blue-50 text-blue-700 ring-blue-200" />
      </div>

      <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">Shop the best. Save more.</h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">Discover curated products, seasonal sales, and a seamless checkout experience.</p>

      <form onSubmit={handleSearchSubmit} className="mt-8 w-full max-w-3xl">
        <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
          <label htmlFor="site-search" className="sr-only">Search products</label>
          <div className="flex flex-1 items-center gap-2 px-3 text-muted-foreground">
            <Search className="size-4" />
            <input
              id="site-search"
              name="q"
              type="search"
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder="Search products, categories, brands..."
              autoComplete="off"
            />
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => toast("Filter coming soon") }>
            <Filter className="size-4" />
            Filters
          </Button>
          <Button type="submit" className="gap-1">
            Search
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Truck className="size-4 text-green-600" /> Free fast delivery</span>
        <span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-blue-600" /> Secure checkout</span>
        <span className="inline-flex items-center gap-2"><BadgePercent className="size-4 text-red-600" /> Exclusive deals</span>
      </div>
    </section>
  )
}


