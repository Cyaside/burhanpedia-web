import React from "react"
import AuthLayout from "@/sections/login/components/AuthLayout"
import { LoginForm } from "@/sections/login/components/LoginForm"
import { RegisterForm } from "@/sections/login/components/RegisterForm"

export function LoginSection() {
  return (
    <AuthLayout heading="Welcome back" subheading="Sign in to continue your shopping.">
      <LoginForm />
    </AuthLayout>
  )
}

export function RegisterSection() {
  return (
    <AuthLayout heading="Create your account" subheading="Join BurhanPedia and start exploring great deals.">
      <RegisterForm />
    </AuthLayout>
  )
}

export default LoginSection


