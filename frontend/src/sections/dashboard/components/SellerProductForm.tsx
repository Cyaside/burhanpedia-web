import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SellerProductFormProps {
  form: {
    name: string;
    price: string;
    stock: string;
    imageUrl: string;
    image: File | null;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const SellerProductForm: React.FC<SellerProductFormProps> = ({ form, onChange, onSubmit, loading, submitting, error }) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
    <div>
      <Label htmlFor="name" className="text-green-700">Product Name</Label>
      <Input
        id="name"
        name="name"
        type="text"
        placeholder="Product Name"
        value={form.name}
        onChange={onChange}
        required
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="price" className="text-blue-700">Price</Label>
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
      <Label htmlFor="stock" className="text-red-700">Stock Quantity</Label>
      <Input
        id="stock"
        name="stock"
        type="number"
        placeholder="Stock Quantity"
        value={form.stock}
        onChange={onChange}
        required
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="image" className="text-green-700">Product Image</Label>
      <Input
        id="image"
        name="image"
        type="file"
        accept="image/*"
        onChange={onChange}
        required
        className="mt-1"
      />
    </div>
    <Button type="submit" disabled={submitting || loading} variant="default" className="bg-green-600 text-white hover:bg-green-700">
      {submitting ? 'Adding...' : 'Add Product'}
    </Button>
    {error && <div className="text-red-600 mt-2">{error}</div>}
  </form>
);

export default SellerProductForm;
