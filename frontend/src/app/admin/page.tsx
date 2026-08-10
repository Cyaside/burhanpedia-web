"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SiteHeader from "@/components/navigation/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/api/commerce";
import { operationsApi } from "@/lib/api/operations";
import { useAuthGuard } from "@/lib/auth";

type VoucherKind = "FIXED" | "PERCENTAGE" | "FREE_SHIPPING";

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "ADMIN") router.replace("/dashboard");
  }, [checking, router, user]);
  const enabled = user?.activeRole === "ADMIN";
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: operationsApi.adminOverview, enabled });
  const clock = useQuery({ queryKey: ["admin-clock"], queryFn: operationsApi.clock, enabled });
  const [kind, setKind] = useState<VoucherKind>("FIXED");
  const advance = useMutation({
    mutationFn: operationsApi.advanceClock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-clock"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });
  const voucher = useMutation({
    mutationFn: operationsApi.createVoucher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
  });

  function createVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("value") ?? "").replace(/\D/g, "");
    const maximum = String(form.get("maximumDiscountAmount") ?? "").replace(/\D/g, "");
    const quota = Number(form.get("quota"));
    voucher.mutate({
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      name: String(form.get("name") ?? "").trim(),
      kind,
      valueAmount: kind === "FIXED" ? value : undefined,
      valueBasisPoints: kind === "PERCENTAGE" ? Number(value) * 100 : undefined,
      maximumDiscountAmount: maximum || undefined,
      minimumSubtotalAmount: String(form.get("minimumSubtotalAmount") ?? "0").replace(/\D/g, "") || "0",
      quota: Number.isInteger(quota) && quota > 0 ? quota : undefined,
      perBuyerLimit: Number(form.get("perBuyerLimit")),
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      endsAt: new Date(String(form.get("endsAt"))).toISOString(),
    });
  }

  if (checking || !user) return null;
  if (user.activeRole !== "ADMIN") return null;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-8">
        <p className="text-sm text-muted-foreground">Operasional Burhanpedia</p>
        <h1 className="mt-1 text-3xl font-bold">Admin monitoring</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pantau antrean sistem, status transaksi, voucher, dan simulasi waktu pengujian.</p>

        {overview.isPending && <p className="mt-8 text-sm">Memuat kondisi sistem…</p>}
        {overview.isError && <p role="alert" className="mt-8 text-sm text-destructive">{overview.error.message}</p>}
        {overview.data && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatusCard title="Pesanan" rows={overview.data.orders} />
              <StatusCard title="Pengiriman" rows={overview.data.deliveries} />
              <StatusCard title="Background jobs" rows={overview.data.jobs} />
              <StatusCard title="Outbox" rows={overview.data.outbox} footer={`${overview.data.deadLetterCount} dead-letter`} />
            </section>
            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
              <section className="rounded-lg border bg-white p-5">
                <h2 className="text-lg font-bold">Voucher aktif dan terjadwal</h2>
                <div className="mt-4 divide-y">
                  {overview.data.vouchers.map((item) => (
                    <article key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                      <div><p className="font-bold">{item.code}</p><p className="mt-1 text-sm text-muted-foreground">{item.name} · {voucherValue(item)}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.startsAt).toLocaleDateString("id-ID")}–{new Date(item.endsAt).toLocaleDateString("id-ID")}</p></div>
                      <div className="text-right text-sm"><p>{item.redemptionCount}/{item.quota ?? "∞"} dipakai</p><p className={item.isActive ? "mt-1 text-success" : "mt-1 text-muted-foreground"}>{item.isActive ? "Aktif" : "Nonaktif"}</p></div>
                    </article>
                  ))}
                  {overview.data.vouchers.length === 0 && <p className="py-5 text-sm text-muted-foreground">Belum ada voucher.</p>}
                </div>
              </section>
              <form onSubmit={createVoucher} className="rounded-lg border bg-white p-5">
                <h2 className="text-lg font-bold">Buat voucher</h2>
                <Field label="Kode"><Input name="code" pattern="[A-Za-z0-9_-]{3,40}" required /></Field>
                <Field label="Nama kampanye"><Input name="name" minLength={3} maxLength={120} required /></Field>
                <Field label="Jenis diskon">
                  <select value={kind} onChange={(event) => setKind(event.target.value as VoucherKind)} className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm">
                    <option value="FIXED">Potongan rupiah</option><option value="PERCENTAGE">Persentase</option><option value="FREE_SHIPPING">Gratis ongkir</option>
                  </select>
                </Field>
                {kind !== "FREE_SHIPPING" && <Field label={kind === "FIXED" ? "Nilai rupiah" : "Persentase 1–100"}><Input name="value" type="number" min={1} max={kind === "PERCENTAGE" ? 100 : undefined} required /></Field>}
                <Field label="Minimum belanja"><Input name="minimumSubtotalAmount" type="number" min={0} defaultValue="0" required /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Kuota"><Input name="quota" type="number" min={1} /></Field><Field label="Batas per buyer"><Input name="perBuyerLimit" type="number" min={1} max={100} defaultValue="1" required /></Field></div>
                <Field label="Mulai"><Input name="startsAt" type="datetime-local" required /></Field>
                <Field label="Berakhir"><Input name="endsAt" type="datetime-local" required /></Field>
                <Button type="submit" className="mt-5 w-full" disabled={voucher.isPending}>{voucher.isPending ? "Menyimpan…" : "Buat voucher"}</Button>
                {voucher.isSuccess && <p role="status" className="mt-3 text-sm text-success">Voucher berhasil dibuat.</p>}
                {voucher.isError && <p role="alert" className="mt-3 text-sm text-destructive">{voucher.error.message}</p>}
              </form>
            </div>
          </>
        )}

        {process.env.NODE_ENV !== "production" && (
          <section className="mt-8 rounded-lg border bg-white p-5">
            <h2 className="text-lg font-bold">Simulasi waktu lokal</h2>
            <p className="mt-2 text-sm text-muted-foreground">Waktu aplikasi: {clock.data ? new Date(clock.data.now).toLocaleString("id-ID") : "Memuat…"}</p>
            <div className="mt-4 flex flex-wrap gap-2">{[1, 3, 7].map((days) => <Button key={days} type="button" variant="outline" disabled={advance.isPending} onClick={() => advance.mutate(days)}>Majukan {days} hari</Button>)}</div>
            {advance.isError && <p role="alert" className="mt-3 text-sm text-destructive">{advance.error.message}</p>}
          </section>
        )}
      </main>
    </div>
  );
}

function StatusCard({ title, rows, footer }: { title: string; rows: Array<{ status: string; count: string }>; footer?: string }) {
  return <article className="rounded-lg border bg-white p-5"><h2 className="font-bold">{title}</h2><dl className="mt-4 space-y-2 text-sm">{rows.map((row) => <div key={row.status} className="flex justify-between gap-3"><dt className="text-muted-foreground">{row.status}</dt><dd className="font-semibold">{row.count}</dd></div>)}</dl>{footer && <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{footer}</p>}</article>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-4 block text-sm font-semibold">{label}<span className="mt-2 block">{children}</span></label>;
}

function voucherValue(item: { kind: string; valueAmount: string | null; valueBasisPoints: number | null }) {
  if (item.kind === "FREE_SHIPPING") return "Gratis ongkir";
  if (item.kind === "PERCENTAGE") return `${(item.valueBasisPoints ?? 0) / 100}%`;
  return formatMoney(item.valueAmount ?? "0");
}
