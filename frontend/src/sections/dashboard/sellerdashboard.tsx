import React, { useState, useEffect } from "react"

import SellerDashboardHeader from "./components/SellerDashboardHeader"
import SellerProductForm from "./components/SellerProductForm"
import SellerProductList from "./components/SellerProductList"
import { getApiUrl } from "@/lib/config"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  imageUrl: string
}

interface SellerDashboardProps {
  sellerId: number
  token: string
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ sellerId, token }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([])
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    image: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.")
      return
    }
    if (!sellerId || typeof sellerId !== "number") {
      setError("Cannot fetch products: seller ID is missing or invalid.")
      return
    }
    fetchProducts(sellerId, token)
    fetchCategories()
  }, [sellerId, token])

  const fetchProducts = async (currentSellerId: number, authToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(`/products/seller/${currentSellerId}`), {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error("Failed to fetch products")
      const data: Product[] = await res.json()
      setProducts(data)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Unknown error")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(getApiUrl("/categories"))
      if (!res.ok) return
      const data = await res.json()
      setCategories(data)
    } catch {
      // ignore
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement & HTMLSelectElement
    if (name === "image" && files) {
      setForm({ ...form, image: files[0] || null })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!form.name || !form.price || !form.stock || !form.image || !token || !sellerId) {
      setError("Please fill all fields.")
      setSubmitting(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append("name", form.name)
      formData.append("price", form.price)
      formData.append("stock", form.stock)
      if (form.description) formData.append("description", form.description)
      if (form.categoryId) formData.append("categoryId", form.categoryId)
      formData.append("image", form.image)

      const res = await fetch(getApiUrl("/products"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to add product")
      setForm({ name: "", price: "", stock: "", description: "", categoryId: "", imageUrl: "", image: null })
      fetchProducts(sellerId, token)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Unknown error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const totalStock = products.reduce((acc, item) => acc + item.stock, 0)

  return (
    <div className="space-y-6">
      <SellerDashboardHeader productCount={products.length} totalStock={totalStock} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add a new product</h3>
          <p className="mb-5 text-sm text-muted-foreground">Upload clear images and keep stock updated.</p>
          <SellerProductForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
            submitting={submitting}
            error={error}
            categories={categories}
          />
        </div>
        <SellerProductList products={products} loading={loading} />
      </div>
    </div>
  )
}

export default SellerDashboard
