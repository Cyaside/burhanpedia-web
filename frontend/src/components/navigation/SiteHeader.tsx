"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Menu, Moon, Search, ShoppingBag, ShoppingCart, Sun, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { getCurrentUser } from "@/lib/auth"

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = React.useState("")
  const [hasSession, setHasSession] = React.useState(false)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then(() => { if (active) setHasSession(true) })
      .catch(() => { if (active) setHasSession(false) })
    return () => { active = false }
  }, [pathname])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/burhan.jpg"
            alt="BurhanPedia"
            width={40}
            height={40}
            className="rounded-xl border border-border/60 bg-white"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">BurhanPedia</p>
            <p className="text-[11px] text-muted-foreground">Modern marketplace</p>
          </div>
        </Link>

        {!isAuthPage && (
          <form onSubmit={handleSubmit} className="relative hidden flex-1 items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 shadow-sm sm:flex">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories, brands"
              className="h-8 border-none bg-transparent px-0 text-sm focus-visible:ring-0"
            />
            <Button type="submit" size="sm" className="rounded-full px-4">Search</Button>
          </form>
        )}

        <div className="flex items-center gap-2">
          {!isAuthPage && (
            <>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Wishlist">
                <Link href="/wishlist"><Heart className="size-4" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Cart">
                <Link href="/cart"><ShoppingCart className="size-4" /></Link>
              </Button>
              {hasSession ? (
                <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Profile">
                  <Link href="/profile"><UserRound className="size-4" /></Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="hidden sm:inline-flex rounded-full">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {!isAuthPage && (
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 pb-3 sm:hidden">
          <form onSubmit={handleSubmit} className="relative flex flex-1 items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 shadow-sm">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="h-8 border-none bg-transparent px-0 text-sm focus-visible:ring-0"
            />
            <Button type="submit" size="sm" className="rounded-full px-4">
              Go
            </Button>
          </form>
        </div>
      )}

      {!isAuthPage && (
        <div className="border-t border-border/60 bg-card/90 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto">
            <Chip href="#categories" label="Categories" />
            <Chip href="#recommended" label="Recommended" />
            <Chip href="#deals" label="Deals" />
            <Chip href="/products" label="Browse all" />
          </div>
        </div>
      )}
    </header>
  )
}

function Chip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
    >
      <ShoppingBag className="size-3.5 text-primary" />
      {label}
    </Link>
  )
}
