import { ConflictException, Injectable } from '@nestjs/common';

export const ORDER_STATUSES = [
  'PACKING',
  'AWAITING_DRIVER',
  'DRIVER_ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELED',
  'RETURNED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PACKING: ['AWAITING_DRIVER', 'CANCELED'],
  AWAITING_DRIVER: ['DRIVER_ASSIGNED', 'RETURNED'],
  DRIVER_ASSIGNED: ['IN_TRANSIT', 'RETURNED'],
  IN_TRANSIT: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

@Injectable()
export class OrderStateMachine {
  assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!TRANSITIONS[from].includes(to)) {
      throw new ConflictException({
        code: 'INVALID_ORDER_TRANSITION',
        detail: `Order cannot transition from ${from} to ${to}.`,
      });
    }
  }
}
