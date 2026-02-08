import Image from "next/image"
import React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, BadgeCheck, Search, ShieldCheck, Store, Truck } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const highlights = [
  { label: "Verified sellers", value: "1.2k", icon: Store },
  { label: "Fast delivery", value: "2 days", icon: Truck },
  { label: "Secure checkout", value: "PCI ready", icon: ShieldCheck },
]

export default function Hero() {
  const router = useRouter()
  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = (formData.get("q") as string) || ""
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`)
    } else {
      toast.info("Type a product name to search")
    }
  }

  return (
    <section className="section-padding section-space" id="top">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-primary shadow-sm">
            Minimal, visual-first shopping
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Shop faster, feel lighter, with a calm marketplace.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Find products quickly, compare clearly, and check out with confidence. Designed to stay out of your way.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <label htmlFor="site-search" className="sr-only">Search products</label>
              <Input
                id="site-search"
                name="q"
                type="search"
                placeholder="Search products, categories, brands"
                autoComplete="off"
                className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="gap-2 rounded-full px-5">
                Search
                <ArrowRight className="size-4" />
              </Button>
              <Button type="button" variant="outline" className="gap-2 rounded-full px-5" onClick={() => router.push("/products")}>
                Browse all
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="green" className="gap-1 rounded-full">
              <BadgeCheck className="size-3" />
              Secure payments
            </Badge>
            <Badge variant="blue" className="gap-1 rounded-full">
              <Store className="size-3" />
              Verified sellers
            </Badge>
            <Badge variant="red" className="gap-1 rounded-full">
              <Truck className="size-3" />
              Fast delivery
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lg">
            <Image
              src="/burhan.jpg"
              alt="Featured"
              width={900}
              height={700}
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-background/90 to-transparent px-5 pb-5 pt-12">
              <div>
                <p className="text-xs text-muted-foreground">Featured seller</p>
                <p className="text-base font-semibold text-foreground">BurhanPedia Official</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full">Follow</Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="size-4 text-primary" />
                  {item.label}
                </div>
                <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

