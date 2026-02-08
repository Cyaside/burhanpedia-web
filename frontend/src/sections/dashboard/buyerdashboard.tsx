import React from "react"
import Image from "next/image"
import { CreditCard, Gift, UserRound } from "lucide-react"

interface Coupon {
  id: number
  code: string
  discount: string
  expiry: string
}

interface BuyerDashboardProps {
  name: string
  email: string
  profileImage?: string
  balance: number
  coupons: Coupon[]
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  name,
  email,
  profileImage,
  balance,
  coupons,
}) => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-600">
                {typeof name === "string" && name.length > 0 ? name.charAt(0) : "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-emerald-600" />
              Verified buyer profile
            </div>
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-blue-600" />
              {coupons.length} coupons available
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4 text-emerald-600" />
            Balance
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">Rp {balance.toLocaleString("id-ID")}</div>
          <p className="mt-2 text-xs text-muted-foreground">Available to spend on your next purchase.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Coupons</h3>
          <span className="text-xs text-muted-foreground">{coupons.length} active</span>
        </div>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-xl border border-border/60 bg-emerald-50 px-4 py-4">
                <div className="text-xs text-emerald-700">Code</div>
                <div className="text-lg font-semibold text-emerald-800">{coupon.code}</div>
                <div className="mt-2 text-sm text-emerald-700">Discount: {coupon.discount}</div>
                <div className="text-xs text-emerald-600">Expires: {coupon.expiry}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyerDashboard
