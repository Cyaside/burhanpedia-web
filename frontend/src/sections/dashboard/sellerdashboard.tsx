import React, { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';

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
    setLoading(true);
    setError(null);
  const token = localStorage.getItem('token');
  if (!form.name || !form.price || !form.stock || !form.image || !token || !sellerId) return;
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
    setLoading(false);
  }
  };

  return (
    <div className="seller-dashboard" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Seller Dashboard</h2>
      <ProductForm
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
      <hr style={{ margin: '24px 0' }} />
      <ProductList products={products} loading={loading} />
    </div>
  );
};

export default SellerDashboard;
