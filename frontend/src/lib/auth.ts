"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export type AppRole = "BUYER" | "SELLER" | "DRIVER" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: AppRole[];
  activeRole: AppRole;
}

export const currentUserQueryKey = ["current-user"] as const;

export function getCurrentUser() {
  return api.get<CurrentUser>("/me");
}

export function roleLabel(role: AppRole) {
  return {
    BUYER: "Pembeli",
    SELLER: "Seller",
    DRIVER: "Driver",
    ADMIN: "Admin",
  }[role];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 30_000,
  });
}

export function useAuthGuard(redirectTo = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const redirected = useRef(false);

  useEffect(() => {
    if (!currentUser.isError || redirected.current) return;
    redirected.current = true;
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${redirectTo}${next}`);
  }, [currentUser.isError, pathname, redirectTo, router]);

  return {
    user: currentUser.data ?? null,
    checking: currentUser.isPending,
    isAuthenticated: Boolean(currentUser.data),
  };
}

export function useRoleGuard(requiredRole: AppRole) {
  const router = useRouter();
  const auth = useAuthGuard();
  const redirected = useRef(false);
  const allowed = auth.user?.activeRole === requiredRole;

  useEffect(() => {
    if (!auth.user || allowed || redirected.current) return;
    redirected.current = true;
    toast.error("Akses tidak tersedia", {
      description: `Peran aktif ${roleLabel(auth.user.activeRole)} tidak dapat membuka halaman ini.`,
    });
    router.replace("/dashboard");
  }, [allowed, auth.user, router]);

  return { ...auth, allowed };
}
