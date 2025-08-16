import React from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

interface ProductListProps {
  products: Product[];
  loading: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ products, loading }) => (
  <div>
    <h3>Products</h3>
    {loading ? <div>Loading...</div> : null}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {products.length === 0 && <p>No products added yet.</p>}
      {products.map((product) => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
          <img src={product.imageUrl} alt={product.name} style={{ maxWidth: 100, marginBottom: 8 }} />
          <div><strong>{product.name}</strong></div>
          <div>Price: ${product.price}</div>
          <div>Stock: {product.stock}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ProductList;
