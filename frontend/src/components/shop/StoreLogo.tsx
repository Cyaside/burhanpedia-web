import Image from "next/image";
import { cn } from "@/lib/utils";

interface StoreLogoProps {
  name: string;
  logoUrl?: string | null;
  logoAltText?: string | null;
  className?: string;
}

export function StoreLogo({ name, logoUrl, logoAltText, className }: StoreLogoProps) {
  return (
    <span
      aria-label={logoUrl ? undefined : `Monogram ${name}`}
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden",
        logoUrl ? "rounded-lg border border-neutral-300 bg-white" : "bg-transparent",
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={logoAltText || `Logo ${name}`}
          fill
          sizes="64px"
          className="object-contain p-1.5"
        />
      ) : (
        <span aria-hidden="true" className="text-lg font-black leading-none tracking-tight text-neutral-950">
          {initials(name)}
        </span>
      )}
    </span>
  );
}

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length > 1) {
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
}
