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
  uploadLogo: async (file: File, storeName: string) => {
    if (!LOGO_TYPES.includes(file.type)) {
      throw new Error("Gunakan logo JPEG, PNG, atau WebP.");
    }
    if (file.size < 1 || file.size > MAX_LOGO_BYTES) {
      throw new Error("Ukuran logo maksimal 5 MB.");
    }
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const checksumSha256 = Array.from(new Uint8Array(digest), (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");
    const pending = await api.post<PendingUpload>("/seller/store/logo/uploads", {
      contentType: file.type,
      byteSize: file.size,
      checksumSha256,
    });
    const uploaded = await fetch(pending.url, {
      method: "PUT",
      headers: pending.headers,
      body: file,
    });
    if (!uploaded.ok) throw new Error("Logo gagal dikirim ke penyimpanan.");
    return api.post<SellerStore>(
      `/seller/store/logo/uploads/${pending.uploadId}/complete`,
      { altText: `Logo ${storeName}` },
    );
  },
};
