"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCatalogCategories } from "@/lib/api/catalog";
import { sellerApi, type VariantInput } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import { useAuthGuard } from "@/lib/auth";

interface VariantDraft extends Omit<VariantInput, "attributes" | "onHand"> {
  key: string;
  attributesText: string;
  onHand: string;
}

const emptyVariant = (key = crypto.randomUUID()): VariantDraft => ({
  key,
  sku: "",
  name: "Default",
  priceAmount: "",
  attributesText: "",
  onHand: "0",
});

export default function NewSellerProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "SELLER") router.replace("/dashboard");
  }, [checking, router, user]);
  const categories = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: listCatalogCategories,
  });
  const store = useQuery({
    queryKey: ["seller-store"],
    queryFn: sellerApi.store,
    enabled: user?.activeRole === "SELLER",
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant("initial")]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      router.push(`/seller/products/${product.id}`);
    },
  });

  function changeName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    if (name.trim().length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setValidationError("Isi nama produk dan slug yang valid.");
      return;
    }
    const normalized = variants.map((variant) => ({
      sku: variant.sku.trim(),
      name: variant.name.trim(),
      priceAmount: variant.priceAmount.trim(),
      attributes: parseAttributes(variant.attributesText),
      onHand: Number(variant.onHand),
    }));
    if (
      normalized.some(
        (variant) =>
          !variant.sku ||
          !variant.name ||
          !/^\d{1,15}$/.test(variant.priceAmount) ||
          !Number.isInteger(variant.onHand) ||
          variant.onHand < 0,
      )
    ) {
      setValidationError("Lengkapi SKU, nama, harga bulat, dan stok setiap varian.");
      return;
    }
    create.mutate({
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
      variants: normalized,
    });
  }

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container max-w-5xl pb-24 pt-8">
        <Link href="/seller/products" className="text-sm text-primary hover:underline">
          ← Produk toko
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Tambah produk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Produk dibuat sebagai draf. Periksa foto, varian, dan stok sebelum mengaktifkannya.
        </p>
        <SellerNavigation />

        {store.isPending && <p className="mt-8 text-sm text-muted-foreground">Memeriksa toko…</p>}
        {store.isError && store.error instanceof ApiError && store.error.status === 404 && (
          <p className="mt-8 rounded-lg border bg-white p-5 text-sm">
            Anda perlu <Link href="/seller/store" className="font-semibold text-primary hover:underline">membuat toko</Link> sebelum menambahkan produk.
          </p>
        )}
        {store.isError && !(store.error instanceof ApiError && store.error.status === 404) && (
          <p role="alert" className="mt-8 text-sm text-destructive">{store.error.message}</p>
        )}

        {store.data && <form onSubmit={submit} className="mt-8 space-y-8">
          <section className="rounded-lg border bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">Informasi produk</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Nama produk" htmlFor="product-name">
                <Input id="product-name" value={name} maxLength={180} onChange={(event) => changeName(event.target.value)} required />
              </Field>
              <Field label="Slug URL" htmlFor="product-slug">
                <Input
                  id="product-slug"
                  value={slug}
                  maxLength={120}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  required
                />
              </Field>
              <Field label="Kategori" htmlFor="product-category">
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <label htmlFor="product-description" className="mt-5 block text-sm font-semibold">
              Deskripsi
            </label>
            <textarea
              id="product-description"
              value={description}
              maxLength={10_000}
              rows={6}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            />
          </section>

          <section className="rounded-lg border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Varian dan stok</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Produk wajib memiliki minimal satu varian.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setVariants((current) => [...current, emptyVariant()])}>
                <Plus aria-hidden="true" /> Tambah varian
              </Button>
            </div>
            <div className="mt-6 space-y-5">
              {variants.map((variant, index) => (
                <fieldset key={variant.key} className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <legend className="px-1 text-sm font-bold">Varian {index + 1}</legend>
                    {variants.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setVariants((current) => current.filter((item) => item.key !== variant.key))}>
                        <Trash2 aria-hidden="true" /> Hapus
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Nama varian" htmlFor={`variant-name-${variant.key}`}>
                      <Input id={`variant-name-${variant.key}`} value={variant.name} maxLength={120} onChange={(event) => updateVariant(variant.key, { name: event.target.value })} required />
                    </Field>
                    <Field label="SKU" htmlFor={`variant-sku-${variant.key}`}>
                      <Input id={`variant-sku-${variant.key}`} value={variant.sku} maxLength={80} onChange={(event) => updateVariant(variant.key, { sku: event.target.value })} required />
                    </Field>
                    <Field label="Harga rupiah" htmlFor={`variant-price-${variant.key}`}>
                      <Input id={`variant-price-${variant.key}`} inputMode="numeric" value={variant.priceAmount} pattern="[0-9]+" onChange={(event) => updateVariant(variant.key, { priceAmount: event.target.value.replace(/\D/g, "") })} required />
                    </Field>
                    <Field label="Stok awal" htmlFor={`variant-stock-${variant.key}`}>
                      <Input id={`variant-stock-${variant.key}`} type="number" min={0} max={1_000_000} value={variant.onHand} onChange={(event) => updateVariant(variant.key, { onHand: event.target.value })} required />
                    </Field>
                  </div>
                  <Field label="Atribut opsional" htmlFor={`variant-attributes-${variant.key}`} hint="Format: Warna=Hitam, Ukuran=L">
                    <Input id={`variant-attributes-${variant.key}`} value={variant.attributesText} onChange={(event) => updateVariant(variant.key, { attributesText: event.target.value })} />
                  </Field>
                </fieldset>
              ))}
            </div>
          </section>

          {(validationError || create.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {validationError ?? create.error?.message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Menyimpan…" : "Simpan sebagai draf"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/seller/products">Batal</Link>
            </Button>
          </div>
        </form>}
      </main>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mt-4 block text-sm font-semibold first:mt-0">
      {label}
      {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseAttributes(value: string) {
  return Object.fromEntries(
    value
      .split(",")
      .map((entry) => entry.split("=").map((part) => part.trim()))
      .filter((entry): entry is [string, string] => entry.length === 2 && Boolean(entry[0]) && Boolean(entry[1])),
  );
}
