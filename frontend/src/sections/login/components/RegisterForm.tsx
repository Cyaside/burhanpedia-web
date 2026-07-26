"use client"

import Link from "next/link"
import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, Loader2, ShoppingBag, Store, Truck, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ApiError, api } from "@/lib/api/client"

const rolesSchema = z.array(z.enum(["BUYER", "SELLER", "DRIVER"])).min(1, "Choose at least one role")

const registerSchema = z
  .object({
    name: z.string().min(2, "Your name is too short"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(12, "Confirm your password"),
    roles: rolesSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: { roles: ["BUYER"] },
  })

  const selectedRoles = watch("roles")

  async function onSubmit(values: RegisterValues) {
    try {
      const data = await api.post<{ name: string }>("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
        roles: values.roles,
      })
      toast.success("Account created successfully", { description: `Welcome, ${data.name}` })
      router.push("/login")
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof ApiError ? error.message : "An error occurred during registration",
      })
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Join BurhanPedia and choose how you want to participate.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Register as</Label>
            <Tabs value={selectedRoles[0]} onValueChange={(v: string) => setValue("roles", [v as "BUYER" | "SELLER" | "DRIVER"]) }>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="BUYER" aria-label="Buyer"><ShoppingBag className="mr-1 size-4" />Buyer</TabsTrigger>
                <TabsTrigger value="SELLER" aria-label="Seller"><Store className="mr-1 size-4" />Seller</TabsTrigger>
                <TabsTrigger value="DRIVER" aria-label="Driver"><Truck className="mr-1 size-4" />Driver</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">You can add more roles later from your dashboard.</p>
            <input type="hidden" {...register("roles.0")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button asChild variant="link" className="px-1">
              <Link href="/login">Sign in</Link>
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

export default RegisterForm
