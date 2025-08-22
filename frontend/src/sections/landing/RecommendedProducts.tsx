import React, { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  seller: {
    name: string;
  };
}

const RecommendedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
    fetch(`${backendUrl}/products/recommended`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching recommended products:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading recommended products...</div>;

  return (
    <section className="recommended-products" style={{ padding: '2rem 0' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Recommended Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px' }} />
            <h3 style={{ margin: '0.5rem 0' }}>{product.name}</h3>
            <p style={{ color: '#333', fontWeight: 'bold' }}>${product.price}</p>
            <p style={{ fontSize: '0.9rem', color: '#888' }}>Seller: {product.seller?.name || 'Unknown'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedProducts;
