import Image from "next/image"
import React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="relative"
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/burhan.jpg"
              alt="Featured"
              fill
              className="object-cover rounded-3xl"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
