import React from "react"
import { LogOut, Shield, Store, UserRound, LayoutGrid, ShoppingBag, Users, BarChart3, Package, Ticket, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type Role = "BUYER" | "SELLER" | "ADMIN"

interface UserProfile {
  name: string
  email: string
}

interface DashboardShellProps {
  user: UserProfile
  roles: Role[]
  activeRole: Role
  onRoleChange: (role: Role) => void
  onLogout: () => void
  children: React.ReactNode
}

const roleIcons: Record<Role, React.ComponentType<{ className?: string }>> = {
  BUYER: UserRound,
  SELLER: Store,
  ADMIN: Shield,
}

const roleNav: Record<Role, { label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  BUYER: [
    { label: "Overview", icon: LayoutGrid },
    { label: "Orders", icon: ShoppingBag },
    { label: "Payments", icon: CreditCard },
    { label: "Coupons", icon: Ticket },
  ],
  SELLER: [
    { label: "Overview", icon: LayoutGrid },
    { label: "Products", icon: Package },
    { label: "Orders", icon: ShoppingBag },
    { label: "Analytics", icon: BarChart3 },
  ],
  ADMIN: [
    { label: "Overview", icon: LayoutGrid },
    { label: "Users", icon: Users },
    { label: "Reports", icon: BarChart3 },
    { label: "Settings", icon: Shield },
  ],
}

export default function DashboardShell({
  user,
  roles,
  activeRole,
  onRoleChange,
  onLogout,
  children,
}: DashboardShellProps) {
  const ActiveIcon = roleIcons[activeRole]

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 flex-col border-r border-border/60 bg-white/90 px-6 py-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-2">
              <ActiveIcon className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</p>
              <p className="text-base font-semibold text-slate-900">{activeRole}</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm">
            {roleNav[activeRole].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground">
                <item.icon className="size-4" />
                {item.label}
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <Button variant="outline" className="w-full gap-2" onClick={onLogout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
                <h1 className="font-heading text-2xl font-semibold text-slate-900">Welcome, {user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {roles.length > 1 && (
                  <Tabs value={activeRole} onValueChange={(value) => onRoleChange(value as Role)}>
                    <TabsList className="bg-slate-100">
                      {roles.map((role) => (
                        <TabsTrigger key={role} value={role} className={cn("text-xs", "data-[state=active]:bg-white") }>
                          {role}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
                <Button variant="outline" className="gap-2 lg:hidden" onClick={onLogout}>
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
