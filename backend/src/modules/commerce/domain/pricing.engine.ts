export const DELIVERY_FEES = {
  INSTANT: 25_000n,
  NEXT_DAY: 15_000n,
  REGULAR: 10_000n,
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_FEES;

export interface PriceLine {
  storeId: string;
  variantId: string;
  unitPrice: bigint;
  quantity: number;
}

export interface PromotionRule {
  kind: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';
  storeId: string | null;
  valueAmount: bigint | null;
  valueBasisPoints: number | null;
  maximumDiscountAmount: bigint | null;
  minimumSubtotalAmount: bigint;
}

export interface StorePrice {
  storeId: string;
  subtotal: bigint;
  discount: bigint;
  shipping: bigint;
  total: bigint;
}

export interface PriceResult {
  stores: StorePrice[];
  subtotal: bigint;
  discount: bigint;
  shipping: bigint;
  total: bigint;
}

export class PricingEngine {
  calculate(
    lines: PriceLine[],
    deliveryMethods: Map<string, DeliveryMethod>,
    promotion: PromotionRule | null,
  ): PriceResult {
    const subtotalByStore = new Map<string, bigint>();
    for (const line of lines) {
      if (
        line.unitPrice < 0n ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1
      ) {
        throw new Error('Invalid pricing line');
      }
      subtotalByStore.set(
        line.storeId,
        (subtotalByStore.get(line.storeId) ?? 0n) +
          line.unitPrice * BigInt(line.quantity),
      );
    }

    const stores = [...subtotalByStore.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([storeId, subtotal]) => {
        const method = deliveryMethods.get(storeId);
        if (!method)
          throw new Error(`Missing delivery method for store ${storeId}`);
        return {
          storeId,
          subtotal,
          shipping: DELIVERY_FEES[method],
          discount: 0n,
          total: 0n,
        };
      });

    if (promotion) this.applyPromotion(stores, promotion);
    for (const store of stores) {
      store.discount = this.minimum(store.discount, store.subtotal);
      store.total = store.subtotal - store.discount + store.shipping;
    }

    return stores.reduce<PriceResult>(
      (result, store) => ({
        stores: [...result.stores, store],
        subtotal: result.subtotal + store.subtotal,
        discount: result.discount + store.discount,
        shipping: result.shipping + store.shipping,
        total: result.total + store.total,
      }),
      { stores: [], subtotal: 0n, discount: 0n, shipping: 0n, total: 0n },
    );
  }

  private applyPromotion(stores: StorePrice[], promotion: PromotionRule): void {
    const eligible = stores.filter(
      (store) => !promotion.storeId || store.storeId === promotion.storeId,
    );
    const eligibleSubtotal = eligible.reduce(
      (sum, store) => sum + store.subtotal,
      0n,
    );
    if (!eligible.length || eligibleSubtotal < promotion.minimumSubtotalAmount)
      return;

    if (promotion.kind === 'FREE_SHIPPING') {
      for (const store of eligible) store.shipping = 0n;
      return;
    }

    let discount =
      promotion.kind === 'FIXED'
        ? (promotion.valueAmount ?? 0n)
        : (eligibleSubtotal * BigInt(promotion.valueBasisPoints ?? 0)) /
          10_000n;
    if (promotion.maximumDiscountAmount !== null) {
      discount = this.minimum(discount, promotion.maximumDiscountAmount);
    }
    discount = this.minimum(discount, eligibleSubtotal);

    let allocated = 0n;
    eligible.forEach((store, index) => {
      const share =
        index === eligible.length - 1
          ? discount - allocated
          : (discount * store.subtotal) / eligibleSubtotal;
      store.discount = share;
      allocated += share;
    });
  }

  private minimum(left: bigint, right: bigint): bigint {
    return left < right ? left : right;
  }
}
