"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, MapPin, Wallet } from "lucide-react";
import SiteHeader from "@/components/navigation/SiteHeader";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/api/commerce";
import { operationsApi } from "@/lib/api/operations";
import { useAuthGuard } from "@/lib/auth";

export default function DriverPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, checking } = useAuthGuard();
  useEffect(() => {
    if (!checking && user && user.activeRole !== "DRIVER") router.replace("/dashboard");
  }, [checking, router, user]);
  const enabled = user?.activeRole === "DRIVER";
  const jobs = useInfiniteQuery({
    queryKey: ["driver-jobs"],
    queryFn: ({ pageParam }) => operationsApi.jobs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
  const deliveries = useQuery({ queryKey: ["driver-deliveries"], queryFn: operationsApi.driverDeliveries, enabled });
  const earnings = useQuery({ queryKey: ["driver-earnings"], queryFn: operationsApi.earnings, enabled });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["driver-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["driver-deliveries"] });
    void queryClient.invalidateQueries({ queryKey: ["driver-earnings"] });
  };
  const claim = useMutation({
    mutationFn: (jobId: string) => operationsApi.claimJob(jobId, `web-${crypto.randomUUID()}`),
    onSuccess: refresh,
  });
  const pickup = useMutation({ mutationFn: operationsApi.pickup, onSuccess: refresh });
  const complete = useMutation({ mutationFn: operationsApi.completeDelivery, onSuccess: refresh });

  if (checking || !user) return null;
  if (user.activeRole !== "DRIVER") return null;

  const active = deliveries.data?.filter((item) => ["CLAIMED", "IN_TRANSIT"].includes(item.status)) ?? [];
  const history = deliveries.data?.filter((item) => !["CLAIMED", "IN_TRANSIT"].includes(item.status)) ?? [];
  const mutationError = claim.error ?? pickup.error ?? complete.error;
  const availableJobs = jobs.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="page-container pb-24 pt-8">
        <p className="text-sm text-muted-foreground">Pusat driver</p>
        <h1 className="mt-1 text-3xl font-bold">Pengiriman</h1>
        {(jobs.isError || deliveries.isError || earnings.isError) && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {jobs.error?.message ?? deliveries.error?.message ?? earnings.error?.message}
          </p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bike className="size-4" /> Pengiriman aktif</p>
            <p className="mt-2 text-3xl font-bold">{active.length}</p>
          </article>
          <article className="rounded-lg border bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" /> Saldo pendapatan</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(earnings.data?.balanceAmount ?? "0")}</p>
          </article>
        </div>

        <section className="mt-10" aria-labelledby="active-deliveries">
          <h2 id="active-deliveries" className="text-xl font-bold">Sedang dikerjakan</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {active.map((delivery) => (
              <article key={delivery.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold">{delivery.orderNumber}</p><p className="mt-1 text-sm text-muted-foreground">{delivery.storeName}</p></div>
                  <span className="text-sm font-semibold text-primary">{delivery.status === "CLAIMED" ? "Siap diambil" : "Dalam perjalanan"}</span>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="size-4 text-primary" /> {delivery.city}, {delivery.province}</p>
                <p className="mt-2 text-xs text-muted-foreground">Batas tiba {new Date(delivery.deliveryDeadlineAt).toLocaleString("id-ID")}</p>
                {delivery.status === "CLAIMED" ? (
                  <Button className="mt-5 w-full" disabled={pickup.isPending} onClick={() => pickup.mutate(delivery.id)}>Konfirmasi pengambilan</Button>
                ) : (
                  <Button className="mt-5 w-full" disabled={complete.isPending} onClick={() => complete.mutate(delivery.id)}>Konfirmasi terkirim</Button>
                )}
              </article>
            ))}
            {!deliveries.isPending && active.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada pengiriman aktif.</p>}
          </div>
        </section>

        <section className="mt-10 border-t pt-8" aria-labelledby="available-jobs">
          <h2 id="available-jobs" className="text-xl font-bold">Pengiriman tersedia</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {availableJobs.map((job) => (
              <article key={job.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{job.storeName}</p><p className="mt-1 text-sm text-muted-foreground">{job.method}</p></div><strong>{formatMoney(job.feeAmount)}</strong></div>
                <p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="size-4 text-primary" /> {job.city}, {job.province}</p>
                <Button variant="outline" className="mt-5 w-full" disabled={claim.isPending} onClick={() => claim.mutate(job.id)}>Ambil pengiriman</Button>
              </article>
            ))}
            {!jobs.isPending && availableJobs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengiriman yang tersedia.</p>}
          </div>
          {jobs.hasNextPage && <Button type="button" variant="outline" className="mt-5" disabled={jobs.isFetchingNextPage} onClick={() => void jobs.fetchNextPage()}>{jobs.isFetchingNextPage ? "Memuat…" : "Muat pengiriman lainnya"}</Button>}
        </section>

        <section className="mt-10 border-t pt-8" aria-labelledby="delivery-history">
          <h2 id="delivery-history" className="text-xl font-bold">Riwayat pengiriman</h2>
          <div className="mt-4 divide-y rounded-lg border bg-white px-5">
            {history.map((delivery) => (
              <div key={delivery.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                <div><p className="font-semibold">{delivery.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{delivery.storeName} · {delivery.city}</p></div>
                <span>{delivery.status}</span>
              </div>
            ))}
            {history.length === 0 && <p className="py-5 text-sm text-muted-foreground">Belum ada riwayat.</p>}
          </div>
        </section>
        {mutationError && <p role="alert" className="mt-5 text-sm text-destructive">{mutationError.message}</p>}
      </main>
    </div>
  );
}
