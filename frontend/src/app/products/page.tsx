import React, { Suspense } from "react";
import ProductListingClient from "./ProductListingClient";

export default function ProductListingPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container py-8 text-sm text-muted-foreground">
          Memuat katalog…
        </div>
      }
    >
      <ProductListingClient />
    </Suspense>
  );
}
