"use client"

import Image from "next/image"
import Link from "next/link"
import React from "react"
import { toast } from "sonner"
import { ArrowRight, BadgePercent, CreditCard, Filter, Search, Sparkles, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

function AnimatedBadge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset animate-in fade-in zoom-in duration-500 " +
        colorClass
      }>
      <Sparkles className="size-3" />
      {text}
    </span>
  )
}

export default function LandingSection() {
  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = (formData.get("q") as string) || ""
    toast.success("Search initiated", { description: query ? `Looking for: ${query}` : "We will add results soon." })
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/burhan.jpg" alt="BurhanPedia" width={32} height={32} className="rounded-md ring-1 ring-border" />
          <span className="text-sm font-semibold">BurhanPedia</span>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href="/login" aria-label="Login">
            Login
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-3xl" />
      </div>

      {/* Hero Section */}
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

        {/* Search Bar */}
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

        {/* engagement row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Truck className="size-4 text-green-600" /> Free fast delivery</span>
          <span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-blue-600" /> Secure checkout</span>
          <span className="inline-flex items-center gap-2"><BadgePercent className="size-4 text-red-600" /> Exclusive deals</span>
        </div>
      </section>
    </main>
  )
}


