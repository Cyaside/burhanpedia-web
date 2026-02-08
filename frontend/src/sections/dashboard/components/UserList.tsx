import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  name: string
  email: string
  role: "BUYER" | "SELLER"
}

interface UserListProps {
  users: User[]
  title: string
  emptyText: string
}

const UserList: React.FC<UserListProps> = ({ users, title, emptyText }) => (
  <Card className="rounded-2xl border-border/70 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <span className="text-xs text-muted-foreground">{users.length} users</span>
    </div>
    {users.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">{emptyText}</div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-border/60 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.role === "SELLER" ? "green" : "blue"}>{user.role}</Badge>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
)

export default UserList
