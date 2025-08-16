import React from 'react';

interface ProductFormProps {
  form: {
    name: string;
    price: string;
    stock: string;
    imageUrl: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ form, onChange, onSubmit, loading, error }) => (
  <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <input
      type="text"
      name="name"
      placeholder="Product Name"
      value={form.name}
      onChange={onChange}
      required
    />
    <input
      type="number"
      name="price"
      placeholder="Price"
      value={form.price}
      onChange={onChange}
      required
    />
    <input
      type="number"
      name="stock"
      placeholder="Stock Quantity"
      value={form.stock}
      onChange={onChange}
      required
    />
    <input
      type="text"
      name="imageUrl"
      placeholder="Image URL (upload not implemented)"
      value={form.imageUrl}
      onChange={onChange}
      required
    />
    <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Product'}</button>
    {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
  </form>
);

export default ProductForm;
