"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/api/catalog";
import { sellerApi, type SellerProduct } from "@/lib/api/seller";
import { useAuthGuard } from "@/lib/auth";

export default function SellerProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "SELLER") router.replace("/dashboard");
  }, [checking, router, user]);
  const [image, setImage] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const product = useQuery({
    queryKey: ["seller-product", id],
    queryFn: () => sellerApi.product(id),
    enabled: user?.activeRole === "SELLER",
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["seller-product", id] });
    void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
  };
  const update = useMutation({
    mutationFn: (input: Parameters<typeof sellerApi.updateProduct>[1]) =>
      sellerApi.updateProduct(id, input),
    onSuccess: refresh,
  });
  const addVariant = useMutation({
    mutationFn: (input: Parameters<typeof sellerApi.addVariant>[1]) =>
      sellerApi.addVariant(id, input),
    onSuccess: refresh,
  });
  const adjust = useMutation({
    mutationFn: ({ variantId, delta, reason }: { variantId: string; delta: number; reason: string }) =>
      sellerApi.adjustInventory(variantId, delta, reason),
    onSuccess: refresh,
  });
  const upload = useMutation({
    mutationFn: ({ file, altText }: { file: File; altText: string }) =>
      sellerApi.uploadProductImage(id, file, altText),
    onSuccess: () => {
      setImage(null);
      setImageAlt("");
    },
  });

  function saveProduct(event: FormEvent<HTMLFormElement>, current: SellerProduct) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      version: current.version,
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      status: String(form.get("status")) as SellerProduct["status"],
    });
  }

  function createVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addVariant.mutate({
      name: String(form.get("name") ?? "").trim(),
      sku: String(form.get("sku") ?? "").trim(),
      priceAmount: String(form.get("priceAmount") ?? "").replace(/\D/g, ""),
      onHand: Number(form.get("onHand")),
      attributes: parseAttributes(String(form.get("attributes") ?? "")),
    });
  }

  function changeStock(event: FormEvent<HTMLFormElement>, variantId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    adjust.mutate({
      variantId,
      delta: Number(form.get("quantityDelta")),
      reason: String(form.get("reason") ?? "").trim(),
    });
  }

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container max-w-6xl pb-24 pt-8">
        <Link href="/seller/products" className="text-sm text-primary hover:underline">
          ← Produk toko
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Kelola produk</h1>
        <SellerNavigation />

        {product.isPending && <p className="mt-8 text-sm">Memuat produk…</p>}
        {product.isError && (
          <p role="alert" className="mt-8 text-sm text-destructive">{product.error.message}</p>
        )}
        {product.data && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <form
                key={product.data.version}
                onSubmit={(event) => saveProduct(event, product.data)}
                className="rounded-lg border bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Informasi produk</h2>
                    <p className="mt-1 text-xs text-muted-foreground">/{product.data.slug}</p>
                  </div>
                  {product.data.status === "ACTIVE" && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/products/${product.data.id}`}>Lihat di toko</Link>
                    </Button>
                  )}
                </div>
                <label htmlFor="seller-product-name" className="mt-5 block text-sm font-semibold">Nama produk</label>
                <Input id="seller-product-name" name="name" className="mt-2" defaultValue={product.data.name} minLength={3} maxLength={180} required />
                <label htmlFor="seller-product-description" className="mt-5 block text-sm font-semibold">Deskripsi</label>
                <textarea id="seller-product-description" name="description" rows={6} maxLength={10_000} defaultValue={product.data.description ?? ""} className="mt-2 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" />
                <label htmlFor="seller-product-status" className="mt-5 block text-sm font-semibold">Status publikasi</label>
                <select id="seller-product-status" name="status" defaultValue={product.data.status} className="mt-2 h-11 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-56">
                  <option value="DRAFT">Draf</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="ARCHIVED">Diarsipkan</option>
                </select>
                <Button type="submit" className="mt-5" disabled={update.isPending}>{update.isPending ? "Menyimpan…" : "Simpan perubahan"}</Button>
                <MutationMessage mutation={update} success="Produk berhasil diperbarui." />
              </form>

              <section className="rounded-lg border bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold">Varian dan persediaan</h2>
                <div className="mt-5 space-y-5">
                  {product.data.variants.map((variant) => (
                    <article key={variant.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{variant.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">SKU {variant.sku}</p>
                        </div>
                        <p className="font-semibold">{formatRupiah(variant.priceAmount)}</p>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 border-y py-3 text-sm">
                        <div><dt className="text-xs text-muted-foreground">Stok fisik</dt><dd className="mt-1 font-semibold">{variant.onHand}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Dipesan</dt><dd className="mt-1 font-semibold">{variant.reserved}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Tersedia</dt><dd className="mt-1 font-semibold">{variant.availableQuantity}</dd></div>
                      </dl>
                      <form onSubmit={(event) => changeStock(event, variant.id)} className="mt-4 grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-end">
                        <label className="text-sm font-semibold">Perubahan stok<Input name="quantityDelta" type="number" className="mt-2" placeholder="+5 / -2" min={-1_000_000} max={1_000_000} required /></label>
                        <label className="text-sm font-semibold">Alasan<Input name="reason" className="mt-2" minLength={3} maxLength={200} placeholder="Restock atau koreksi" required /></label>
                        <Button type="submit" variant="outline" disabled={adjust.isPending}>Perbarui stok</Button>
                      </form>
                    </article>
                  ))}
                </div>
                <MutationMessage mutation={adjust} success="Stok berhasil diperbarui." />
              </section>
            </div>

            <aside className="space-y-6">
              <form onSubmit={createVariant} className="rounded-lg border bg-white p-5">
                <h2 className="text-lg font-bold">Tambah varian</h2>
                <FormInput label="Nama varian" name="name" defaultValue="Default" />
                <FormInput label="SKU" name="sku" />
                <FormInput label="Harga rupiah" name="priceAmount" inputMode="numeric" pattern="[0-9]+" />
                <FormInput label="Stok awal" name="onHand" type="number" min={0} max={1_000_000} defaultValue="0" />
                <FormInput label="Atribut opsional" name="attributes" placeholder="Warna=Hitam, Ukuran=L" required={false} />
                <Button type="submit" className="mt-5 w-full" disabled={addVariant.isPending}>{addVariant.isPending ? "Menambahkan…" : "Tambah varian"}</Button>
                <MutationMessage mutation={addVariant} success="Varian berhasil ditambahkan." />
              </form>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (image && imageAlt.trim()) upload.mutate({ file: image, altText: imageAlt.trim() });
                }}
                className="rounded-lg border bg-white p-5"
              >
                <h2 className="text-lg font-bold">Tambah foto produk</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">JPEG, PNG, atau WebP; minimal 256 × 256 px; maksimal 5 MB.</p>
                <Input type="file" accept="image/jpeg,image/png,image/webp" className="mt-4 h-auto py-2" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
                <Input value={imageAlt} maxLength={180} placeholder="Deskripsi foto" className="mt-3" onChange={(event) => setImageAlt(event.target.value)} />
                <Button type="submit" className="mt-4 w-full" disabled={!image || !imageAlt.trim() || upload.isPending}>{upload.isPending ? "Mengunggah…" : "Unggah foto"}</Button>
                <MutationMessage mutation={upload} success="Foto berhasil ditambahkan." />
              </form>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function FormInput({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <label className="mt-4 block text-sm font-semibold">
      {label}
      <Input name={name} className="mt-2" required {...props} />
    </label>
  );
}

function MutationMessage({ mutation, success }: { mutation: { isSuccess: boolean; isError: boolean; error: Error | null }; success: string }) {
  return (
    <div aria-live="polite" className="mt-3 text-sm">
      {mutation.isSuccess && <p className="text-success">{success}</p>}
      {mutation.isError && <p role="alert" className="text-destructive">{mutation.error?.message}</p>}
    </div>
  );
}

function parseAttributes(value: string) {
  return Object.fromEntries(
    value
      .split(",")
      .map((entry) => entry.split("=").map((part) => part.trim()))
      .filter((entry): entry is [string, string] => entry.length === 2 && Boolean(entry[0]) && Boolean(entry[1])),
  );
}
