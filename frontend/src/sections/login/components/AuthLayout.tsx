import Image from "next/image"
import React from "react"
import { Shield, Sparkles, TrendingUp } from "lucide-react"

import { Card } from "@/components/ui/card"
import SiteHeader from "@/components/navigation/SiteHeader"

export function AuthLayout({
  heading,
  subheading,
  children,
}: {
  heading: string
  subheading: string
  children: React.ReactNode
}) {
  return (
    <main className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-glow" />
      <SiteHeader />

      <div className="section-padding section-space">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-white/80 p-8 shadow-lg lg:flex">
            <div className="absolute -left-20 -top-16 size-64 rounded-full bg-emerald-100 blur-3xl" />
            <div className="absolute -right-20 -bottom-16 size-64 rounded-full bg-blue-100 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3">
              <Image src="/burhan.jpg" alt="BurhanPedia" width={56} height={56} className="rounded-2xl border border-emerald-100" />
              <div>
                <p className="text-xs text-muted-foreground">Welcome to</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight">BurhanPedia</h1>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">{heading}</h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{subheading}</p>
              <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2"><Shield className="size-4 text-emerald-600" /> Secure by design</div>
                <div className="inline-flex items-center gap-2"><Sparkles className="size-4 text-blue-600" /> Curated seller network</div>
                <div className="inline-flex items-center gap-2"><TrendingUp className="size-4 text-red-600" /> Growth-ready dashboards</div>
              </div>
            </div>

            <div className="relative z-10 text-xs text-muted-foreground">Copyright (c) {new Date().getFullYear()} BurhanPedia</div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <Image src="/burhan.jpg" alt="BurhanPedia" width={40} height={40} className="rounded-xl border border-emerald-100" />
                <div>
                  <h1 className="text-lg font-semibold leading-tight">BurhanPedia</h1>
                  <p className="text-xs text-muted-foreground">{subheading}</p>
                </div>
              </div>

              <Card className="border-border/70 bg-white/95 shadow-lg">
                {children}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
