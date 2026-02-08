import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import SiteHeader from "@/components/navigation/SiteHeader"

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <section className="section-padding section-space">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-emerald-100 blur-3xl" />
            <Image
              src="/burhan.jpg"
              alt="Burhan is lost"
              width={180}
              height={180}
              className="rounded-3xl border border-border/60 bg-white shadow-lg"
              priority
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">404 error</p>
            <h1 className="font-heading text-4xl font-semibold text-slate-900 sm:text-5xl">We cannot find that page.</h1>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or has been moved. Let us get you back on track.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
