"use client"

import React from "react"

import SiteHeader from "@/components/navigation/SiteHeader"
import Hero from "@/sections/landing/components/Hero"
import HowItWorks from "@/sections/landing/components/HowItWorks"
import Categories from "@/sections/landing/components/Categories"
import Testimonials from "@/sections/landing/components/Testimonials"
import ContactUs from "@/sections/landing/components/ContactUs"
import CallToAction from "@/sections/landing/components/CallToAction"
import Footer from "@/sections/landing/components/Footer"
import RecommendedProducts from "@/sections/landing/RecommendedProducts"
import { MobileDock } from "@/components/navigation/MobileDock"

export default function LandingSection() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Categories />
      <RecommendedProducts />
      <Testimonials />
      <ContactUs />
      <CallToAction />
      <Footer />
      <MobileDock />
    </main>
  )
}
