import type { Metadata } from "next"
import React from "react"
import { Manrope } from "next/font/google"

import "@/styles/index.css"
import { Toaster } from "@/components/ui/sonner"
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider"

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Burhanpedia — Belanja mudah, pilihan jelas",
  description: "Temukan produk dari berbagai toko di Burhanpedia.",
  icons: { icon: "/brand-mark.svg" },
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${bodyFont.variable} min-h-dvh bg-background text-foreground antialiased`}>
        <ReactQueryProvider>
          {children}
          <Toaster position="top-center" />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
