import Image from "next/image"
import Link from "next/link"
import React from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        <Image src="/burhan.jpg" alt="BurhanPedia" width={32} height={32} className="rounded-md ring-1 ring-border" />
        <span className="text-sm font-semibold">BurhanPedia</span>
      </div>
      <Button asChild variant="outline" size="sm" className="gap-1">
        <Link href="/login" aria-label="Login">
          Login
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </header>
  )
}


