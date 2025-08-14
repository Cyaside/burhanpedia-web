"use client"

import React from "react"
import Header from "@/sections/landing/components/Header"
import Hero from "@/sections/landing/components/Hero"

export default function LandingSection() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <Header />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-3xl" />
      </div>
      <Hero />
    </main>
  )
}


