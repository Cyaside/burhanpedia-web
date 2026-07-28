import { PricingEngine } from './pricing.engine';

describe('PricingEngine', () => {
  const engine = new PricingEngine();
  const lines = [
    { storeId: 'a', variantId: 'v1', unitPrice: 100_000n, quantity: 2 },
    { storeId: 'b', variantId: 'v2', unitPrice: 50_000n, quantity: 1 },
  ];
  const deliveries = new Map([
    ['a', 'REGULAR' as const],
    ['b', 'NEXT_DAY' as const],
  ]);

  it('calculates server-owned multi-store totals', () => {
    expect(engine.calculate(lines, deliveries, null)).toEqual({
      stores: [
        {
          storeId: 'a',
          subtotal: 200_000n,
          discount: 0n,
          shipping: 10_000n,
          total: 210_000n,
        },
        {
          storeId: 'b',
          subtotal: 50_000n,
          discount: 0n,
          shipping: 15_000n,
          total: 65_000n,
        },
      ],
      subtotal: 250_000n,
      discount: 0n,
      shipping: 25_000n,
      total: 275_000n,
    });
  });

  it('uses integer basis points and deterministic allocation', () => {
    const result = engine.calculate(lines, deliveries, {
      kind: 'PERCENTAGE',
      storeId: null,
      valueAmount: null,
      valueBasisPoints: 1_100,
      maximumDiscountAmount: 30_000n,
      minimumSubtotalAmount: 100_000n,
    });
    expect(result.discount).toBe(27_500n);
    expect(result.stores.map(({ discount }) => discount)).toEqual([
      22_000n,
      5_500n,
    ]);
  });

  it('applies store-scoped free shipping only to the target store', () => {
    const result = engine.calculate(lines, deliveries, {
      kind: 'FREE_SHIPPING',
      storeId: 'b',
      valueAmount: null,
      valueBasisPoints: null,
      maximumDiscountAmount: null,
      minimumSubtotalAmount: 0n,
    });
    expect(result.shipping).toBe(10_000n);
  });
});
