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
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white",
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
        <span aria-hidden="true" className="text-sm font-extrabold text-primary">
          {initials(name)}
        </span>
      )}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
