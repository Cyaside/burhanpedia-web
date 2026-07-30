import { OrderStateMachine, ORDER_STATUSES } from './order-state-machine';
import type { OrderStatus } from './order-state-machine';
import { ConflictException } from '@nestjs/common';

describe('OrderStateMachine', () => {
  const machine = new OrderStateMachine();

  it.each<[OrderStatus, OrderStatus]>([
    ['PACKING', 'AWAITING_DRIVER'],
    ['AWAITING_DRIVER', 'DRIVER_ASSIGNED'],
    ['DRIVER_ASSIGNED', 'IN_TRANSIT'],
    ['IN_TRANSIT', 'DELIVERED'],
    ['DELIVERED', 'COMPLETED'],
    ['AWAITING_DRIVER', 'RETURNED'],
    ['RETURNED', 'REFUNDED'],
  ])('allows %s -> %s', (from, to) => {
    expect(() => machine.assertTransition(from, to)).not.toThrow();
  });

  it('rejects every terminal transition', () => {
    for (const from of ['COMPLETED', 'CANCELED', 'REFUNDED'] as const) {
      for (const to of ORDER_STATUSES) {
        expect(() => machine.assertTransition(from, to)).toThrow(
          ConflictException,
        );
      }
    }
  });
});
