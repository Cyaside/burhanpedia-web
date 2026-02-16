import React, { useState, useEffect, useMemo } from "react"

import SellerDashboardHeader from "./components/SellerDashboardHeader"
import SellerProductForm from "./components/SellerProductForm"
import SellerProductList from "./components/SellerProductList"
import { getApiUrl } from "@/lib/config"
import { deleteProduct, fetchSellerBalance, fetchSellerOrders, fetchSellerTransactions, updateProduct } from "@/lib/api/shop"
import { SellerOrderItem, SellerTransaction } from "@/types/shop"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  imageUrl: string
  description?: string | null
  category?: { id: number; name: string; slug: string } | null
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState<string | null>(null)
  const [sellerBalance, setSellerBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<SellerTransaction[]>([])
  const [orders, setOrders] = useState<SellerOrderItem[]>([])

  const initialForm = useMemo(
    () => ({
      name: "",
      price: "",
      stock: "",
      description: "",
      categoryId: "",
      imageUrl: "",
      image: null as File | null,
    }),
    []
  )

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
    fetchSellerData()
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

  const fetchSellerData = async () => {
    setSalesLoading(true)
    setSalesError(null)
    try {
      const [balanceRes, txRes, orderRes] = await Promise.all([
        fetchSellerBalance(),
        fetchSellerTransactions(),
        fetchSellerOrders(),
      ])
      setSellerBalance(balanceRes.balance ?? 0)
      setTransactions(txRes)
      setOrders(orderRes)
    } catch (err) {
      setSalesError(err instanceof Error ? err.message : "Failed to load seller stats")
    } finally {
      setSalesLoading(false)
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

    if (!form.name || !form.price || !form.stock || !token || !sellerId) {
      setError("Please fill all required fields.")
      setSubmitting(false)
      return
    }
    try {
      const price = Number(form.price)
      const stock = Number(form.stock)
      if (Number.isNaN(price) || Number.isNaN(stock)) {
        throw new Error("Price and stock must be valid numbers")
      }

      if (editingId) {
        await updateProduct(editingId, {
          name: form.name,
          description: form.description || "",
          price,
          stock,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
        })
        setEditingId(null)
        setForm(initialForm)
      } else {
        if (!form.image) {
          throw new Error("Product image is required")
        }
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
        setForm(initialForm)
      }
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

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
      categoryId: product.category?.id ? String(product.category.id) : "",
      imageUrl: product.imageUrl || "",
      image: null,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(initialForm)
    setError(null)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setError(null)
    try {
      await deleteProduct(productId)
      fetchProducts(sellerId, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  const totalStock = products.reduce((acc, item) => acc + item.stock, 0)
  const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.type === "SALE" ? tx.amount : 0), 0)
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <SellerDashboardHeader productCount={products.length} totalStock={totalStock} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">Balance</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">Rp {sellerBalance.toLocaleString("id-ID")}</div>
          <p className="mt-1 text-xs text-muted-foreground">Current payout balance.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">Total sales</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">Rp {totalRevenue.toLocaleString("id-ID")}</div>
          <p className="mt-1 text-xs text-muted-foreground">From completed checkouts.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">Orders</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{orders.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Line items sold across orders.</p>
        </div>
      </div>
      {salesLoading && <p className="text-sm text-muted-foreground">Loading seller stats...</p>}
      {salesError && <p className="text-sm text-destructive">{salesError}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">{editingId ? "Edit product" : "Add a new product"}</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            {editingId ? "Update product details and keep stock accurate." : "Upload clear images and keep stock updated."}
          </p>
          <SellerProductForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
            submitting={submitting}
            error={error}
            categories={categories}
            mode={editingId ? "edit" : "create"}
            showImage={!editingId}
            imageRequired={!editingId}
            onCancel={editingId ? handleCancelEdit : undefined}
          />
        </div>
        <SellerProductList products={products} loading={loading} onEdit={handleEdit} onDelete={handleDelete} editingId={editingId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent orders</h3>
          <p className="text-sm text-muted-foreground">Latest items sold from your store.</p>
          <div className="mt-4 space-y-3">
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
            {recentOrders.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">Order #{item.orderId} - Qty {item.quantity}</p>
                </div>
                <div className="text-right font-semibold text-slate-900">
                  Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Sales ledger</h3>
          <p className="text-sm text-muted-foreground">Track earnings and adjustments.</p>
          <div className="mt-4 space-y-3">
            {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions recorded.</p>}
            {transactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.note || "Sale activity"}</p>
                </div>
                <div className="text-right font-semibold text-slate-900">Rp {tx.amount.toLocaleString("id-ID")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
