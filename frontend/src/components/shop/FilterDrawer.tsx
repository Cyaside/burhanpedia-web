import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidersHorizontal } from "lucide-react"
import React from "react"

interface FilterDrawerProps {
  categories: { label: string; value: string }[]
  selectedCategory?: string
  onCategoryChange: (value?: string) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  rating?: number
  onRatingChange: (value?: number) => void
}

export function FilterDrawer({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  rating,
  onRatingChange,
}: FilterDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full">
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm font-semibold text-foreground">Categories</p>
            <div className="mt-3 grid gap-2">
              <button
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${!selectedCategory ? "border-primary/70 bg-primary/5" : "border-border/70"}`}
                onClick={() => onCategoryChange(undefined)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    selectedCategory === cat.value ? "border-primary/70 bg-primary/5" : "border-border/70"
                  }`}
                  onClick={() => onCategoryChange(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Price range (IDR)</p>
            <div className="mt-4 space-y-3">
              <Slider
                min={0}
                max={5_000_000}
                step={50_000}
                value={[priceRange[0], priceRange[1]]}
                onValueChange={(v) => onPriceChange([v[0], v[1]])}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{priceRange[0].toLocaleString("id-ID")}</span>
                <span>{priceRange[1].toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Rating</p>
            <div className="mt-3 space-y-2">
              {[4, 3, 2].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={rating === r}
                    onCheckedChange={(checked) => onRatingChange(checked ? r : undefined)}
                  />
                  {r} stars & up
                </label>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

