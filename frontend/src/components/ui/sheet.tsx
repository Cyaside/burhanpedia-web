"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40", className)}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetSides = {
  top: "inset-x-0 top-0 border-b rounded-b-3xl",
  bottom: "inset-x-0 bottom-0 border-t rounded-t-3xl",
  left: "inset-y-0 left-0 h-full w-80 border-r sm:max-w-lg",
  right: "inset-y-0 right-0 h-full w-80 border-l sm:max-w-lg",
} as const

type Side = keyof typeof sheetSides

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: Side }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid gap-4 bg-card p-6 shadow-lg outline-none transition data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        sheetSides[side],
        className
      )}
      {...props}
    >
      {children}
      <SheetClose className="absolute right-4 top-4 rounded-full border border-border/60 p-1.5 text-muted-foreground hover:text-foreground">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </SheetClose>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
