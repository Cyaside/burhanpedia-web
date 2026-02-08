import React, { useEffect, useState } from "react"
import { Users, Store, ShoppingBag } from "lucide-react"
import UserList from "./components/UserList"
import StatsCard from "./components/StatsCard"
import { getApiUrl } from "@/lib/config"

interface User {
  id: number
  name: string
  email: string
  role: "BUYER" | "SELLER"
}

const AdminDashboard: React.FC = () => {
  const [sellers, setSellers] = useState<User[]>([])
  const [buyers, setBuyers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(getApiUrl("/users"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const users: User[] = await response.json()
        setSellers(users.filter((u) => u.role === "SELLER"))
        setBuyers(users.filter((u) => u.role === "BUYER"))
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Unknown error")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading accounts...</div>
  }
  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  }

  const total = sellers.length + buyers.length

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Total users" value={total} icon={Users} />
        <StatsCard label="Sellers" value={sellers.length} icon={Store} />
        <StatsCard label="Buyers" value={buyers.length} icon={ShoppingBag} />
      </div>
      <div className="grid gap-6">
        <UserList users={sellers} title="Seller accounts" emptyText="No sellers found." />
        <UserList users={buyers} title="Buyer accounts" emptyText="No buyers found." />
      </div>
    </div>
  )
}

export default AdminDashboard
