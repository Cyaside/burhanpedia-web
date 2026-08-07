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
    image: unsplash("photo-1562560017-e008835e92bc", 640),
    alt: "Koleksi laptop, ponsel, kamera, dan aksesori elektronik",
  },
  {
    slug: "fashion",
    fallbackName: "Fashion",
    image: unsplash("photo-1721152531086-70a0d0bb33f9", 640),
    alt: "Beragam pakaian dan manekin di dalam toko fashion",
  },
  {
    slug: "rumah-tangga",
    fallbackName: "Rumah Tangga",
    image: unsplash("photo-1554995207-c18c203602cb", 640),
    alt: "Ruang keluarga dengan sofa, meja, tanaman, dan dekorasi rumah",
  },
  {
    slug: "hobi",
    fallbackName: "Hobi & Koleksi",
    image: unsplash("photo-1771440047898-a83cc89b4fe2", 640),
    alt: "Beragam alat seni dan kerajinan di meja kerja",
  },
  {
    slug: "kesehatan",
    fallbackName: "Kesehatan",
    image: unsplash("photo-1696861286643-341a8d7a79e9", 640),
    alt: "Rak produk kesehatan di sebuah apotek",
  },
] as const;

export const quickShoppingLinks = [
  { label: "Baru di katalog", href: "/products?sort=newest" },
  { label: "Harga terendah", href: "/products?sort=price_asc" },
  { label: "Rating 4 ke atas", href: "/products?minRating=4" },
  { label: "Lihat keranjang", href: "/cart" },
] as const;
