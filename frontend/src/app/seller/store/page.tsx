"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { StoreLogo } from "@/components/shop/StoreLogo";
import { SellerNavigation } from "@/components/seller/SellerNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoleGuard } from "@/lib/auth";
import { sellerApi } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";

export default function SellerStorePage() {
  const { allowed, checking } = useRoleGuard("SELLER");
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const store = useQuery({
    queryKey: ["seller-store"],
    queryFn: sellerApi.store,
    enabled: allowed,
  });
  const upload = useMutation({
    mutationFn: (selected: File) =>
      sellerApi.uploadLogo(selected, store.data?.name ?? "toko"),
    onSuccess: (updated) => {
      queryClient.setQueryData(["seller-store"], updated);
      void queryClient.invalidateQueries({
        queryKey: ["public-store", updated.slug],
      });
      setFile(null);
    },
  });
  const create = useMutation({
    mutationFn: sellerApi.createStore,
    onSuccess: (created) => queryClient.setQueryData(["seller-store"], created),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file) upload.mutate(file);
  }

  function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate({
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
    });
  }

  if (checking || !allowed) return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container max-w-3xl pb-24 pt-8">
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Identitas toko</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Logo adalah identitas milik toko Anda. Jika belum diunggah,
          Burhanpedia menampilkan monogram nama toko yang netral.
        </p>
        <SellerNavigation />

        {store.isPending && <p className="mt-8 text-sm">Memuat toko…</p>}
        {store.isError && !(store.error instanceof ApiError && store.error.status === 404) && (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {store.error.message}
          </p>
        )}
        {store.isError && store.error instanceof ApiError && store.error.status === 404 && (
          <form onSubmit={submitStore} className="mt-8 rounded-lg border bg-white p-6">
            <h2 className="text-xl font-bold">Buat toko pertama Anda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Selesaikan identitas toko sebelum menambahkan produk dan mengunggah logo.
            </p>
            <label htmlFor="new-store-name" className="mt-6 block text-sm font-semibold">Nama toko</label>
            <Input
              id="new-store-name"
              value={name}
              minLength={3}
              maxLength={120}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                if (!slugTouched) setSlug(toSlug(value));
              }}
              className="mt-2"
              required
            />
            <label htmlFor="new-store-slug" className="mt-5 block text-sm font-semibold">Alamat toko</label>
            <div className="mt-2 flex items-center rounded-md border border-input bg-white focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 text-sm text-muted-foreground">/stores/</span>
              <Input
                id="new-store-slug"
                value={slug}
                maxLength={80}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value.toLowerCase());
                }}
                className="border-0 focus-visible:ring-0"
                required
              />
            </div>
            <label htmlFor="new-store-description" className="mt-5 block text-sm font-semibold">Deskripsi singkat</label>
            <textarea
              id="new-store-description"
              value={description}
              maxLength={2000}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            />
            <Button type="submit" className="mt-5" disabled={create.isPending}>
              {create.isPending ? "Membuat toko…" : "Buat toko"}
            </Button>
            {create.isError && <p role="alert" className="mt-3 text-sm text-destructive">{create.error.message}</p>}
          </form>
        )}
        {store.data && (
          <section className="mt-8 rounded-lg border bg-white p-6">
            <div className="flex items-center gap-4">
              <StoreLogo
                name={store.data.name}
                logoUrl={store.data.logoUrl}
                logoAltText={store.data.logoAltText}
                className="size-20"
              />
              <div>
                <h2 className="text-xl font-bold">{store.data.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {store.data.logoUrl ? "Logo toko aktif" : "Menggunakan monogram sementara"}
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 border-t pt-6">
              <label htmlFor="store-logo" className="text-sm font-semibold">
                Unggah logo toko
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG, atau WebP; persegi minimal 256 × 256 px; maksimal 5 MB.
              </p>
              <Input
                id="store-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-3 h-auto py-2"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <Button type="submit" className="mt-4" disabled={!file || upload.isPending}>
                {upload.isPending ? "Mengunggah…" : "Simpan logo"}
              </Button>
              {upload.isSuccess && (
                <p role="status" className="mt-3 text-sm text-success">
                  Logo toko berhasil diperbarui.
                </p>
              )}
              {upload.isError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {upload.error.message}
                </p>
              )}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
