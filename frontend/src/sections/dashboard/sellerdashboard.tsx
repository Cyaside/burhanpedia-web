import React, { useState, useEffect } from 'react';
import SellerDashboardHeader from './components/SellerDashboardHeader';
import SellerProductForm from './components/SellerProductForm';
import SellerProductList from './components/SellerProductList';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

const SellerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    imageUrl: '',
    image: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get sellerId from profile API
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        const id = Number(data.id);
        if (!id || isNaN(id)) {
          setError('Invalid seller ID from profile API.');
          return;
        }
        setSellerId(id);
        fetchProducts(id, token);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch profile');
      });
  }, []);

  const fetchProducts = async (sellerId: number, token: string) => {
    if (!sellerId || typeof sellerId !== 'number') {
      setError('Cannot fetch products: seller ID is missing or invalid.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/products/seller/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files) {
      setForm({ ...form, image: files[0] || null });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!form.name || !form.price || !form.stock || !form.image || !token || !sellerId) {
      setError('Please fill all fields.');
      setSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('image', form.image);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to add product');
      setForm({ name: '', price: '', stock: '', imageUrl: '', image: null });
      fetchProducts(sellerId, token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="seller-dashboard max-w-3xl mx-auto py-10 px-6 bg-white rounded-2xl shadow-xl border border-blue-100"
      style={{
        background: 'linear-gradient(135deg, #e6f9f0 0%, #f0f6ff 100%)',
        boxShadow: '0 8px 32px rgba(0, 128, 0, 0.08), 0 1.5px 8px rgba(0, 0, 255, 0.04)',
      }}
    >
      <div className="mb-8">
        <SellerDashboardHeader />
      </div>
      <div className="mb-10 p-6 rounded-xl border border-green-100 bg-white shadow-sm">
        <SellerProductForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          submitting={submitting}
          error={error}
        />
      </div>
      <div className="p-6 rounded-xl border border-blue-100 bg-white shadow-sm">
        <SellerProductList products={products} loading={loading} />
      </div>
    </div>
  );
};

export default SellerDashboard;
