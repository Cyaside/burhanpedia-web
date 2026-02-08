"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"

export default function GlobalNavigationOverlay() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const hideTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false)
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    function findAnchor(element: Element | null): HTMLAnchorElement | null {
      let el: Element | null = element
      while (el && el !== document.body) {
        if (el instanceof HTMLAnchorElement) return el
        el = el.parentElement
      }
      return null
    }

    function isValidClick(event: MouseEvent): boolean {
      if (event.defaultPrevented || event.button !== 0) return false
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
      return true
    }

    function shouldShowOverlay(anchor: HTMLAnchorElement | null): boolean {
      if (!anchor) return false
      if (anchor.dataset.noOverlay === "true") return false
      if (anchor.target && anchor.target !== "_self") return false
      const hrefAttr = anchor.getAttribute("href") || ""
      if (!hrefAttr) return false
      if (hrefAttr.startsWith("#") || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return false
      return true
    }

    function getInternalResolvedUrl(hrefAttr: string): URL | null {
      if (hrefAttr.startsWith("/")) {
        try {
          return new URL(hrefAttr, window.location.href)
        } catch {
          return null
        }
      }
      try {
        const url = new URL(hrefAttr, window.location.href)
        if (url.origin === window.location.origin) return url
      } catch {
        return null
      }
      return null
    }

    function isSamePath(resolvedUrl: URL | null): boolean {
      if (!resolvedUrl) return false
      return resolvedUrl.pathname + resolvedUrl.search === window.location.pathname + window.location.search
    }

    function onClick(event: MouseEvent) {
      if (!isValidClick(event)) return

      const anchor = findAnchor(event.target as Element | null)
      if (!shouldShowOverlay(anchor)) return

      const hrefAttr = anchor!.getAttribute("href") || ""
      const resolvedUrl = getInternalResolvedUrl(hrefAttr)
      if (!resolvedUrl) return

      if (isSamePath(resolvedUrl)) return

      setIsNavigating(true)

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => {
        setIsNavigating(false)
        hideTimerRef.current = null
      }, 8000)
    }

    function onBeforeUnload() {
      setIsNavigating(true)
    }

    window.addEventListener("click", onClick, { capture: true })
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("click", onClick, { capture: true })
      window.removeEventListener("beforeunload", onBeforeUnload)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [])

  return (
    <div
      className={[
        "fixed inset-0 z-50 transition-opacity duration-150",
        isNavigating ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-hidden={!isNavigating}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
      <div className="relative grid h-full place-items-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-7 py-6 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="size-2 rounded-full bg-blue-500" />
            <span className="size-2 rounded-full bg-red-500" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" aria-hidden />
          <output className="text-xs font-medium text-muted-foreground">Navigating to your next stop...</output>
        </div>
      </div>
    </div>
  )
}
