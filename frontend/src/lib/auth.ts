"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"

export type AppRole = "BUYER" | "SELLER" | "DRIVER" | "ADMIN"

export interface CurrentUser {
  id: string
  name: string
  email: string
  roles: AppRole[]
  activeRole: AppRole
}

export function getCurrentUser() {
  return api.get<CurrentUser>("/me")
}

export async function ensureAuthenticated(
  router: ReturnType<typeof useRouter>,
  redirectTo = "/login"
): Promise<boolean> {
  try {
    await getCurrentUser()
    return true
  } catch {
    router.push(redirectTo)
    return false
  }
}

export function useAuthGuard(redirectTo = "/login") {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) router.replace(redirectTo)
      })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
  }, [redirectTo, router])

  return { user, checking, isAuthenticated: !!user }
}
