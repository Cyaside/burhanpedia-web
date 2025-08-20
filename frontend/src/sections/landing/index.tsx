"use client"

import React from "react"
import Header from "@/sections/landing/components/Header"
import Hero from "@/sections/landing/components/Hero"
import ContactUs from "@/sections/landing/components/ContactUs"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import Footer from "@/sections/landing/components/Footer"

export default function LandingSection() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <Header />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-3xl" />
      </div>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center justify-center flex-1 w-full px-4"
      >
        <Card className="w-full max-w-5xl mx-auto p-0 bg-transparent border-none shadow-none">
          <div className="min-h-[80vh] flex flex-col justify-center">
            <Hero />
          </div>
        </Card>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-2xl mx-auto mt-12"
        >
          <div className="min-h-[80vh] flex flex-col justify-center">
            <ContactUs />
          </div>
        </motion.div>
      </motion.section>
      <Footer />
    </main>
  )
}


