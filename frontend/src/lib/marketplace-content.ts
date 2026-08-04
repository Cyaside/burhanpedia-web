const unsplash = (photoId: string, width: number) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=82`;

export const storefrontHero = {
  image: unsplash("photo-1770013413878-2530e2c3d82b", 1400),
  alt: "Pemilik usaha lokal memeriksa paket pesanan di meja kerja",
};

export const storefrontPromotions = [
  {
    eyebrow: "Pilihan teknologi",
    title: "Perangkat kerja dan hiburan",
    description: "Bandingkan stok elektronik dari toko pilihan.",
    categorySlug: "elektronik",
    fallbackQuery: "elektronik",
    image: unsplash("photo-1562560017-e008835e92bc", 900),
    alt: "Laptop, ponsel, kamera, dan aksesori elektronik di atas meja biru",
  },
  {
    eyebrow: "Rumah lebih nyaman",
    title: "Perlengkapan rumah sehari-hari",
    description: "Temukan peralatan yang siap dipakai di rumah.",
    categorySlug: "rumah-tangga",
    fallbackQuery: "rumah tangga",
    image: unsplash("photo-1556910602-38f53e68e15d", 900),
    alt: "Peralatan masak tersusun di rak dapur",
  },
] as const;

export const categoryVisuals = [
  {
    slug: "elektronik",
    fallbackName: "Elektronik",
    image: unsplash("photo-1737885197905-5bb7251b267e", 640),
    alt: "Headphone studio di depan layar komputer",
  },
  {
    slug: "fashion",
    fallbackName: "Fashion",
    image: unsplash("photo-1603400521630-9f2de124b33b", 640),
    alt: "Koleksi pakaian bernuansa netral di sebuah butik",
  },
  {
    slug: "rumah-tangga",
    fallbackName: "Rumah Tangga",
    image: unsplash("photo-1556910602-38f53e68e15d", 640),
    alt: "Peralatan masak tersusun di rak dapur",
  },
  {
    slug: "hobi",
    fallbackName: "Hobi & Koleksi",
    image: unsplash("photo-1674615420480-1a8b651aeb05", 640),
    alt: "Kamera compact dan perlengkapan kreatif di atas meja",
  },
  {
    slug: "kesehatan",
    fallbackName: "Kesehatan",
    image: unsplash("photo-1768483018807-bd0b9ab86539", 640),
    alt: "Rangkaian produk perawatan diri di atas rak",
  },
] as const;

export const quickShoppingLinks = [
  { label: "Baru di katalog", href: "/products?sort=newest" },
  { label: "Harga terendah", href: "/products?sort=price_asc" },
  { label: "Rating 4 ke atas", href: "/products?minRating=4" },
  { label: "Lihat keranjang", href: "/cart" },
] as const;
