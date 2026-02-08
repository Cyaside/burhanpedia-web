"use client"

import React from "react"

import SiteHeader from "@/components/navigation/SiteHeader"
import Hero from "@/sections/landing/components/Hero"
import RecommendedProducts from "@/sections/landing/RecommendedProducts"
import ContactUs from "@/sections/landing/components/ContactUs"
import { MobileDock } from "@/components/navigation/MobileDock"

export default function LandingSection() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <SiteHeader />
      <Hero />
      <RecommendedProducts />
      <ContactUs />
      <MobileDock />
    </main>
  )
}
