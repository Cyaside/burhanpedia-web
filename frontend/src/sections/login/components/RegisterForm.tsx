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

const roleSchema = z.enum(["BUYER", "SELLER", "ADMIN"]) 

const registerSchema = z
  .object({
    name: z.string().min(2, "Your name is too short"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
    role: roleSchema,
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
    defaultValues: { role: "BUYER" },
  })

  const selectedRole = watch("role")

  async function onSubmit(values: RegisterValues) {
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const roleLabel = values.role === "BUYER" ? "Buyer" : values.role === "SELLER" ? "Seller" : "Admin"
        toast.success("Account created successfully", { description: `Welcome, ${data.name} (${roleLabel})` })
        
        // Redirect to login page
        router.push("/login");
      } else {
        const errorData = await response.json();
        toast.error("Registration failed", { description: errorData.message || "Failed to create account" });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Registration failed", { description: "An error occurred during registration" });
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Sign up and choose your role.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Register as</Label>
            <Tabs value={selectedRole} onValueChange={(v) => setValue("role", v as RegisterValues["role"]) }>
              <TabsList>
                <TabsTrigger value="BUYER" aria-label="Buyer"><ShoppingBag className="mr-1 size-4" />Buyer</TabsTrigger>
                <TabsTrigger value="SELLER" aria-label="Seller"><Store className="mr-1 size-4" />Seller</TabsTrigger>
                <TabsTrigger value="ADMIN" aria-label="Admin"><Shield className="mr-1 size-4" />Admin</TabsTrigger>
              </TabsList>
            </Tabs>
            <input type="hidden" {...register("role")} />
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? {" "}
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


