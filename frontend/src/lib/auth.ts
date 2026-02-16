"use client"

import { useEffect, useState } from "react"
import { useRouter, type AppRouterInstance } from "next/navigation"

export function getAuthToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function requireAuth(router: AppRouterInstance, redirectTo = "/login") {
  const token = getAuthToken()
  if (!token) {
    router.push(redirectTo)
    return false
  }
  return true
}

export function useAuthGuard(redirectTo = "/login") {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = getAuthToken()
    if (!stored) {
      router.push(redirectTo)
      setChecking(false)
      return
    }
    setToken(stored)
    setChecking(false)
  }, [router, redirectTo])

  return { token, checking, isAuthed: !!token }
}
