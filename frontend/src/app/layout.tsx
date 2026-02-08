import type { Metadata } from "next"
import React from "react"
import { Manrope, Space_Grotesk } from "next/font/google"

import "@/styles/index.css"
import { Toaster } from "@/components/ui/sonner"
import GlobalNavigationOverlay from "@/components/navigation/GlobalNavigationOverlay"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider"

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BurhanPedia",
  description: "Knowledge with a smile.",
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/burhan.jpg" type="image/jpeg" />
      </head>
      <body className={`${bodyFont.variable} ${headingFont.variable} min-h-dvh bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <ReactQueryProvider>
            <GlobalNavigationOverlay />
            {children}
            <Toaster richColors position="top-center" />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
