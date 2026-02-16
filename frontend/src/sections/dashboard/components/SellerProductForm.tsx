import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SellerProductFormProps {
  form: {
    name: string
    price: string
    stock: string
    description: string
    categoryId: string
    imageUrl: string
    image: File | null
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  submitting: boolean
  error: string | null
  categories?: { id: number; name: string }[]
  mode?: "create" | "edit"
  showImage?: boolean
  imageRequired?: boolean
  onCancel?: () => void
}

const SellerProductForm: React.FC<SellerProductFormProps> = ({
  form,
  onChange,
  onSubmit,
  loading,
  submitting,
  error,
  categories = [],
  mode = "create",
  showImage = true,
  imageRequired = true,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="name">Product name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Example: Wireless headset"
          value={form.name}
          onChange={onChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={onChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <div className="mt-1">
          <select
            id="categoryId"
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        name="description"
        type="text"
        placeholder="Short description"
        value={form.description}
        onChange={onChange}
        className="mt-1"
      />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="stock">Stock quantity</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          placeholder="Stock quantity"
          value={form.stock}
          onChange={onChange}
          required
          className="mt-1"
        />
      </div>
      {showImage && (
        <div>
          <Label htmlFor="image">Product image</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={onChange}
            required={imageRequired}
            className="mt-1"
          />
        </div>
      )}
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="submit" disabled={submitting || loading} className="w-full gap-2">
        {submitting ? (mode === "edit" ? "Saving..." : "Adding...") : mode === "edit" ? "Save changes" : "Add product"}
      </Button>
      {mode === "edit" && onCancel && (
        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
    {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
  </form>
)

export default SellerProductForm
