import type { Metadata } from "next"
import React from "react"

import "@/styles/index.css"

export const metadata: Metadata = {
  title: "BurhanPedia",
  description: "Knowledge with a smile.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}


