"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { StoreLogo } from "@/components/shop/StoreLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthGuard } from "@/lib/auth";
import { sellerApi } from "@/lib/api/seller";

export default function SellerStorePage() {
  const { user, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const store = useQuery({
    queryKey: ["seller-store"],
    queryFn: sellerApi.store,
    enabled: user?.activeRole === "SELLER",
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file) upload.mutate(file);
  }

  if (checking || !user) return null;
  if (user.activeRole !== "SELLER") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Aktifkan peran seller</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ganti peran aktif ke SELLER sebelum mengelola identitas toko.
        </p>
        <Button asChild className="mt-5">
          <Link href="/dashboard">Kembali ke dashboard</Link>
        </Button>
      </main>
    );
  }

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

        {store.isPending && <p className="mt-8 text-sm">Memuat toko…</p>}
        {store.isError && (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {store.error.message}
          </p>
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
