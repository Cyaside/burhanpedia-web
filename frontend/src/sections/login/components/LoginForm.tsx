"use client"

import Link from "next/link"
import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, Loader2, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/config"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  async function onSubmit(values: LoginValues) {
    try {
      const response = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("token", data.access_token)
        toast.success("Logged in successfully", { description: `Welcome back, ${data.user.name}` })
        router.push("/dashboard")
      } else {
        const errorData = await response.json()
        toast.error("Login failed", { description: errorData.message || "Invalid credentials" })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Login failed", { description: "An error occurred during login" })
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage your orders, products, and profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
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
