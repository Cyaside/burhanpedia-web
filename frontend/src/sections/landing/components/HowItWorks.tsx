import React from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Search, CreditCard, Truck } from "lucide-react"

const steps = [
  {
    title: "Discover",
    description: "Search curated catalogs and verified sellers in seconds.",
    icon: Search,
  },
  {
    title: "Compare",
    description: "Review reviews, pricing, and delivery options with ease.",
    icon: ShoppingBag,
  },
  {
    title: "Pay safely",
    description: "Checkout with secure, flexible payment methods.",
    icon: CreditCard,
  },
  {
    title: "Track",
    description: "Real-time order tracking from checkout to your door.",
    icon: Truck,
  },
]

export default function HowItWorks() {
  return (
    <section className="section-padding section-space" id="how-it-works">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">How it works</p>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">From search to delivery, made effortless.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">Every flow is designed to reduce friction for both buyers and sellers.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <step.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
