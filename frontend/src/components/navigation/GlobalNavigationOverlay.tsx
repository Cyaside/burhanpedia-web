"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"

export default function GlobalNavigationOverlay() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const hideTimerRef = React.useRef<number | null>(null)

  // Hide overlay when the route has changed
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

    function onClick(event: MouseEvent) {
      // Only react to primary button, without modifier keys
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = findAnchor(event.target as Element | null)
      if (!anchor) return

      // Skip if explicit opt-out
      if (anchor.dataset.noOverlay === "true") return

      // Respect target
      if (anchor.target && anchor.target !== "_self") return

      const hrefAttr = anchor.getAttribute("href") || ""
      if (!hrefAttr) return
      if (hrefAttr.startsWith("#") || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return

      let isInternal = false
      let resolvedUrl: URL | null = null
      if (hrefAttr.startsWith("/")) {
        isInternal = true
        try { resolvedUrl = new URL(hrefAttr, window.location.href) } catch { resolvedUrl = null }
      } else {
        try {
          const url = new URL(hrefAttr, window.location.href)
          isInternal = url.origin === window.location.origin
          resolvedUrl = url
        } catch {
          // non-URL or invalid
          isInternal = false
          resolvedUrl = null
        }
      }

      if (!isInternal) return

      // Skip if navigating to the same path + search (no real transition)
      if (resolvedUrl && (resolvedUrl.pathname + resolvedUrl.search) === (window.location.pathname + window.location.search)) {
        return
      }

      // Show overlay immediately
      setIsNavigating(true)

      // Safety: auto-hide if navigation does not occur
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => {
        setIsNavigating(false)
        hideTimerRef.current = null
      }, 8000)
    }

    function onBeforeUnload() {
      // Show overlay during unload/refresh
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

  const overlayVisible = isNavigating

  return (
    <div
      className={[
        "fixed inset-0 z-50 transition-opacity duration-150",
        overlayVisible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-hidden={!overlayVisible}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative grid h-full place-items-center">
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/95 px-6 py-5 shadow-md">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <span className="text-xs text-muted-foreground" role="status">Navigating…</span>
        </div>
      </div>
    </div>
  )
}


