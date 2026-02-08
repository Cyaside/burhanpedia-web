import React from "react"
import { Laptop, Shirt, Home, Sparkles, Dumbbell, Book } from "lucide-react"

const categories = [
  { label: "Electronics", description: "Smart devices and accessories", icon: Laptop, tone: "bg-blue-50 text-blue-700" },
  { label: "Fashion", description: "Daily essentials and style", icon: Shirt, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Home", description: "Comfort for every space", icon: Home, tone: "bg-red-50 text-red-700" },
  { label: "Beauty", description: "Skincare and self-care", icon: Sparkles, tone: "bg-rose-50 text-rose-700" },
  { label: "Sports", description: "Active gear and recovery", icon: Dumbbell, tone: "bg-blue-50 text-blue-700" },
  { label: "Books", description: "Learn and level up", icon: Book, tone: "bg-emerald-50 text-emerald-700" },
]

export default function Categories() {
  return (
    <section className="section-padding section-space" id="categories">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Categories</p>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">Pick a category and start exploring.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">We spotlight trusted categories with high quality fulfillment rates.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.label} className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
              <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-2xl ${category.tone}`}>
                <category.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{category.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
