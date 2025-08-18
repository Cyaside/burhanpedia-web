import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

interface SellerProductListProps {
  products: Product[];
  loading: boolean;
}

const SellerProductList: React.FC<SellerProductListProps> = ({ products, loading }) => {
  let content;

  if (loading) {
    content = (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  } else if (products.length === 0) {
    content = <div className="text-gray-500">No products added yet.</div>;
  } else {
    content = (
      <motion.div
        className="grid gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="flex items-center gap-4 p-4 rounded-lg border shadow-sm bg-white"
            whileHover={{ scale: 1.03, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-md border"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <div className="flex-1">
              <div className="font-bold text-green-700 text-lg">{product.name}</div>
              <div className="text-blue-700">Price: <span className="font-semibold">${product.price}</span></div>
              <div className="text-red-700">Stock: <span className="font-semibold">{product.stock}</span></div>
            </div>
            <Badge variant="green">In Stock</Badge>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-700">Your Products</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default SellerProductList;
