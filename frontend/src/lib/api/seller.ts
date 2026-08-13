import { api } from "./client";

export interface SellerStore {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  logoAltText: string | null;
  status: string;
}

interface SellerVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  priceAmount: string;
  status: string;
  onHand: number;
  reserved: number;
  availableQuantity: number;
}

export interface SellerProduct {
  id: string;
  storeId: string;
  slug: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  minPriceAmount: string | null;
  variants: SellerVariant[];
  createdAt: string;
}

export interface VariantInput {
  sku: string;
  name: string;
  priceAmount: string;
  attributes: Record<string, string>;
  onHand: number;
}

export interface CreateProductInput {
  slug: string;
  name: string;
  description?: string;
  categoryId?: string;
  variants: VariantInput[];
}

interface PendingUpload {
  uploadId: string;
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}

const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export const sellerApi = {
  store: () => api.get<SellerStore>("/seller/store"),
  createStore: (input: { slug: string; name: string; description?: string }) =>
    api.post<SellerStore>("/stores", input),
  products: (cursor?: string) =>
    api.get<{ items: SellerProduct[]; nextCursor: string | null }>(
      `/seller/products?limit=24${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  product: (productId: string) =>
    api.get<SellerProduct>(`/seller/products/${productId}`),
  createProduct: (input: CreateProductInput) =>
    api.post<SellerProduct>("/seller/products", input),
  updateProduct: (
    productId: string,
    input: {
      version: number;
      name?: string;
      description?: string;
      categoryId?: string;
      status?: SellerProduct["status"];
    },
  ) => api.patch<SellerProduct>(`/seller/products/${productId}`, input),
  addVariant: (productId: string, input: VariantInput) =>
    api.post<{ id: string; priceAmount: string; onHand: number }>(
      `/seller/products/${productId}/variants`,
      input,
    ),
  adjustInventory: (variantId: string, quantityDelta: number, reason: string) =>
    api.post<{ onHand: number; reserved: number; version: number }>(
      `/seller/variants/${variantId}/inventory/adjustments`,
      { quantityDelta, reason },
    ),
  uploadProductImage: async (productId: string, file: File, altText: string) => {
    validateImage(file);
    const pending = await requestUpload(
      `/seller/products/${productId}/images/uploads`,
      file,
    );
    await putUpload(pending, file);
    return api.post<{ id: string; url: string; altText: string; position: number }>(
      `/seller/products/${productId}/images/uploads/${pending.uploadId}/complete`,
      { altText },
    );
  },
  uploadLogo: async (file: File, storeName: string) => {
    validateImage(file);
    const pending = await requestUpload("/seller/store/logo/uploads", file);
    await putUpload(pending, file);
    return api.post<SellerStore>(
      `/seller/store/logo/uploads/${pending.uploadId}/complete`,
      { altText: `Logo ${storeName}` },
    );
  },
};

function validateImage(file: File) {
  if (!LOGO_TYPES.includes(file.type)) {
    throw new Error("Gunakan gambar JPEG, PNG, atau WebP.");
  }
  if (file.size < 1 || file.size > MAX_LOGO_BYTES) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }
}

async function requestUpload(path: string, file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const checksumSha256 = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  return api.post<PendingUpload>(path, {
    contentType: file.type,
    byteSize: file.size,
    checksumSha256,
  });
}

async function putUpload(pending: PendingUpload, file: File) {
  const uploaded = await fetch(pending.url, {
    method: "PUT",
    headers: pending.headers,
    body: file,
  });
  if (!uploaded.ok) throw new Error("Gambar gagal dikirim ke penyimpanan.");
}
