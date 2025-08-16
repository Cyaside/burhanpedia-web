import React, { useState } from 'react';

interface Product {
  name: string;
  price: number;
  stock: number;
  image: string;
}

const SellerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm({ ...form, image: reader.result as string });
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.image) return;
    setProducts([
      ...products,
      {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image
      }
    ]);
    setForm({ name: '', price: '', stock: '', image: '' });
    setImagePreview('');
  };

  return (
    <div className="seller-dashboard" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Seller Dashboard</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock Quantity"
          value={form.stock}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
        />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, marginTop: 8 }} />
        )}
        <button type="submit">Add Product</button>
      </form>
      <hr style={{ margin: '24px 0' }} />
      <h3>Products</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {products.length === 0 && <p>No products added yet.</p>}
        {products.map((product, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
            <img src={product.image} alt={product.name} style={{ maxWidth: 100, marginBottom: 8 }} />
            <div><strong>{product.name}</strong></div>
            <div>Price: ${product.price}</div>
            <div>Stock: {product.stock}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
