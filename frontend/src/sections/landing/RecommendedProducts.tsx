import React, { JSX, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ProductCard } from "./components/ProductCard";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  seller?: { name?: string };
  description?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const skeletonArray = Array.from({ length: 6 }).map((_, i) => i);

export default function RecommendedProducts(): JSX.Element {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${backendUrl}/products/recommended`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Error fetching recommended products:", err);
        setError("Gagal memuat produk — coba lagi nanti.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Recommended for you</h2>
        <div className="flex items-center gap-3">
          <Badge>Personalized</Badge>
          <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading skeletonnya */}
      {loading && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {skeletonArray.map((i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="overflow-hidden rounded-md bg-white shadow">
                <div className="w-full aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 bg-red-50 rounded-md border border-red-100 text-red-700">{error}</div>
      )}

      {/* Empty state */}
      {!loading && products && products.length === 0 && !error && (
        <div className="p-6 rounded-md border border-dashed text-muted-foreground">No recommendations available right now.</div>
      )}

      {/* Products grid */}
      {!loading && products && products.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} formatCurrency={formatCurrency} itemVariants={itemVariants} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
