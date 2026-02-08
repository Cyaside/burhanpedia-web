import React from "react"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Alma Putri",
    role: "Buyer",
    quote: "Checkout feels effortless and the seller communication is super clear.",
  },
  {
    name: "Rafiq Ardana",
    role: "Seller",
    quote: "Listing products is quick and the analytics help me understand demand.",
  },
  {
    name: "Nadia Prasetyo",
    role: "Buyer",
    quote: "Fast delivery updates and curated recommendations keep me coming back.",
  },
]

export default function Testimonials() {
  return (
    <section className="section-padding section-space" id="testimonials">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Testimonials</p>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">Trusted by buyers and sellers alike.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">A marketplace is only as strong as the people who build it.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-700">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
