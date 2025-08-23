import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ShoppingCart, Eye } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  seller?: { name?: string };
  description?: string;
}

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  itemVariants: Variants;
}

export function ProductCard({ product: p, formatCurrency, itemVariants }: ProductCardProps) {
  return (
    <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}>
      <Card className="flex flex-col h-full">
        <div className="relative w-full overflow-hidden rounded-t-md bg-gray-100">
          <Image
            src={p.imageUrl}
            alt={p.name}
            width={400}
            height={176}
            className="w-full h-44 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/fallback-product.png";
            }}
            priority={false}
          />
        </div>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium leading-tight break-words line-clamp-2">{p.name}</h3>
              {/* Buat placement jenis product nanti disini*/}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-semibold">{formatCurrency(p.price)}</div>
              <div className="text-xs text-muted-foreground mt-1 max-w-[100px] truncate">Seller: {p.seller?.name ?? "Unknown"}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar>
              <span className="sr-only">Seller avatar</span>
            </Avatar>
            <div className="text-xs text-muted-foreground truncate max-w-[80px]">{p.seller?.name ?? "Seller"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Eye size={16} />
              View
            </Button>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button size="sm" className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Add
              </Button>
            </motion.div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
