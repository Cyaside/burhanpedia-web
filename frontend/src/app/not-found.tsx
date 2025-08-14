import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="absolute -inset-4 -z-10 animate-pulse rounded-2xl bg-accent/40" />
          <Image
            src="/burhan.jpg"
            alt="Burhan is lost"
            width={200}
            height={200}
            className="rounded-2xl border shadow-md"
            priority
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404 - Page Not Found</h1>
          <p className="text-muted-foreground max-w-prose">
            Looks like Burhan wandered off. The page you're looking for doesn't exist or has moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Refresh</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}


