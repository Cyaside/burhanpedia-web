import React, { JSX } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, ShoppingBag, Store, Twitter } from "lucide-react"

export default function Footer(): JSX.Element {
  return (
    <footer className="border-t border-border/60 bg-white" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/burhan.jpg"
                alt="BurhanPedia logo"
                width={52}
                height={52}
                className="rounded-xl border border-emerald-100"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">BurhanPedia</h3>
                <p className="text-xs text-muted-foreground">Your trusted marketplace for curated products.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for sellers who want growth and buyers who want confidence. Every transaction stays transparent.
            </p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <a className="rounded-full border border-border/60 p-2 hover:text-emerald-600" href="#" aria-label="Twitter">
                <Twitter className="size-4" />
              </a>
              <a className="rounded-full border border-border/60 p-2 hover:text-blue-600" href="#" aria-label="Email">
                <Mail className="size-4" />
              </a>
              <a className="rounded-full border border-border/60 p-2 hover:text-red-600" href="#" aria-label="Marketplace">
                <ShoppingBag className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Marketplace</h4>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <a className="hover:text-foreground" href="#categories">Categories</a>
              <a className="hover:text-foreground" href="#recommended">Recommended</a>
              <a className="hover:text-foreground" href="#testimonials">Reviews</a>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">For sellers</h4>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link className="hover:text-foreground" href="/register">Open a store</Link>
              <Link className="hover:text-foreground" href="/login">Seller login</Link>
              <a className="hover:text-foreground" href="#contact">Partnerships</a>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Support</h4>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <a className="hover:text-foreground" href="#contact">Help center</a>
              <a className="hover:text-foreground" href="#contact">Contact us</a>
              <a className="hover:text-foreground" href="#how-it-works">Shipping info</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>Copyright (c) {new Date().getFullYear()} BurhanPedia. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <Store className="size-3" />
              Seller-first platform
            </span>
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="size-3" />
              Buyer protection included
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
