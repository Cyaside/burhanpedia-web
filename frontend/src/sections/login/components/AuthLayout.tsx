import Image from "next/image"
import React from "react"
import { Shield, Sparkles } from "lucide-react"

import { Card } from "@/components/ui/card"

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
    <main className="relative grid min-h-dvh grid-cols-1 p-6 lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 aspect-square w-[40vw] rounded-full bg-blue-500/20 blur-3xl mix-blend-multiply" />
        <div className="absolute -right-24 -bottom-32 aspect-square w-[45vw] rounded-full bg-red-500/20 blur-3xl mix-blend-multiply" />
        <div className="absolute left-1/2 top-1/2 aspect-square w-[35vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/20 blur-3xl mix-blend-multiply" />
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden rounded-2xl border bg-card/50 p-8 backdrop-blur lg:flex">
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 size-64 rounded-full bg-secondary/70 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <Image src="/burhan.jpg" alt="BurhanPedia" width={56} height={56} className="rounded-xl ring-1 ring-border" />
          <div>
            <p className="text-sm text-muted-foreground">Welcome to</p>
            <h1 className="text-2xl font-extrabold tracking-tight">BurhanPedia</h1>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-balance text-4xl font-bold tracking-tight">{heading}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{subheading}</p>
          <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2"><Shield className="size-4 text-green-600" /> Secure by design</div>
            <div className="inline-flex items-center gap-2"><Sparkles className="size-4 text-yellow-600" /> Smooth shopping experience</div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">© {new Date().getFullYear()} BurhanPedia</div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image src="/burhan.jpg" alt="BurhanPedia" width={40} height={40} className="rounded-lg ring-1 ring-border" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">BurhanPedia</h1>
              <p className="text-xs text-muted-foreground">{subheading}</p>
            </div>
          </div>

          <Card className="border-muted/60 bg-card/95 shadow-lg">
            {children}
          </Card>
        </div>
      </div>
    </main>
  )
}

export default AuthLayout


