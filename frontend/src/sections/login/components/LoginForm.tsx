"use client"

import Link from "next/link"
import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, Loader2, Shield, ShoppingBag, Store, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

const roleSchema = z.enum(["buyer", "seller", "admin"]) 

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: roleSchema,
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { role: "buyer" },
  })

  const selectedRole = watch("role")

  async function onSubmit(values: LoginValues) {
    await new Promise((r) => setTimeout(r, 800))
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("role", values.role)
      }
    } catch {}
    const roleLabel = values.role === "buyer" ? "Buyer" : values.role === "seller" ? "Seller" : "Admin"
    toast.success("Logged in", { description: `Welcome back, ${values.email} (${roleLabel})` })
    router.push("/")
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials and choose your role.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Sign in as</Label>
            <Tabs value={selectedRole} onValueChange={(v) => setValue("role", v as LoginValues["role"]) }>
              <TabsList>
                <TabsTrigger value="buyer" aria-label="Buyer"><ShoppingBag className="mr-1 size-4" />Buyer</TabsTrigger>
                <TabsTrigger value="seller" aria-label="Seller"><Store className="mr-1 size-4" />Seller</TabsTrigger>
                <TabsTrigger value="admin" aria-label="Admin"><Shield className="mr-1 size-4" />Admin</TabsTrigger>
              </TabsList>
            </Tabs>
            <input type="hidden" {...register("role")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account? {" "}
            <Button asChild variant="link" className="px-1">
              <Link href="/register">Create one</Link>
            </Button>
          </p>
          <div className="text-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Home className="mr-2 size-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}

export default LoginForm


