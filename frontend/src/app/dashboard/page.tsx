"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getApiUrl } from "@/lib/config"
import AdminDashboard from "@/sections/dashboard/admindashboard"
import SellerDashboard from "@/sections/dashboard/sellerdashboard"
import BuyerDashboard from "@/sections/dashboard/buyerdashboard"
import DashboardShell, { Role } from "@/sections/dashboard/components/DashboardShell"

interface BuyerProfile {
  id: number
  balance?: number
  voucher?: string | null
}

interface SellerProfile {
  id: number
  balance?: number
}

interface AdminProfile {
  id: number
}

interface UserProfile {
  id: number
  name: string
  email: string
  buyerProfile?: BuyerProfile | null
  sellerProfile?: SellerProfile | null
  adminProfile?: AdminProfile | null
}

interface Coupon {
  id: number
  code: string
  discount: string
  expiry: string
}

const fallbackCoupons: Coupon[] = [
  {
    id: 1,
    code: "WELCOME10",
    discount: "10% Off",
    expiry: "2026-12-31",
  },
  {
    id: 2,
    code: "MEGA32",
    discount: "32% Off",
    expiry: "2026-09-30",
  },
]

function deriveRoles(user: UserProfile): Role[] {
  const roles: Role[] = []
  if (user.buyerProfile) roles.push("BUYER")
  if (user.sellerProfile) roles.push("SELLER")
  if (user.adminProfile) roles.push("ADMIN")
  return roles.length ? roles : ["BUYER"]
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [activeRole, setActiveRole] = useState<Role>("BUYER")
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  const fetchUserProfile = useCallback(
    async (authToken: string) => {
      try {
        const response = await fetch(getApiUrl("/auth/profile"), {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (response.ok) {
          const userData = (await response.json()) as UserProfile
          setUser(userData)
          const derivedRoles = deriveRoles(userData)
          setRoles(derivedRoles)
          setActiveRole((prev) => (derivedRoles.includes(prev) ? prev : derivedRoles[0]))
        } else {
          localStorage.removeItem("token")
          router.push("/login")
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        localStorage.removeItem("token")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    const storedToken = localStorage.getItem("token")

    if (!storedToken) {
      router.push("/login")
      return
    }

    setToken(storedToken)
    fetchUserProfile(storedToken)
  }, [router, fetchUserProfile])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  let dashboardContent: React.ReactNode = null

  if (activeRole === "ADMIN") {
    dashboardContent = <AdminDashboard />
  } else if (activeRole === "SELLER") {
    dashboardContent = <SellerDashboard sellerId={user.id} token={token || ""} />
  } else if (activeRole === "BUYER") {
    const balance = typeof user.buyerProfile?.balance === "number" ? user.buyerProfile.balance : 250000
    const coupons = fallbackCoupons
    dashboardContent = (
      <BuyerDashboard
        name={user.name}
        email={user.email}
        balance={balance}
        coupons={coupons}
      />
    )
  }

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      roles={roles}
      activeRole={activeRole}
      onRoleChange={setActiveRole}
      onLogout={handleLogout}
    >
      {dashboardContent}
    </DashboardShell>
  )
}
