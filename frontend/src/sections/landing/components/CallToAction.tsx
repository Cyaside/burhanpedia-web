import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function CallToAction() {
  return (
    <section className="section-padding section-space">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-white px-8 py-10 shadow-lg">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-emerald-100 blur-3xl" />
          <div className="absolute -left-12 bottom-0 size-40 rounded-full bg-blue-100 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Start today</p>
              <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">Build your storefront or find the perfect product in minutes.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Join BurhanPedia to grow your business or discover curated deals from trusted sellers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="gap-2">
                <Link href="/register">
                  Create account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
