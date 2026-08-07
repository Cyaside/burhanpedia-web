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
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-neutral-300",
        logoUrl ? "bg-white" : "bg-neutral-900",
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
        <span aria-hidden="true" className="text-sm font-black tracking-tight text-white">
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
