import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OperationsRepository } from '../infrastructure/operations.repository';

@Injectable()
export class OperationsService {
  constructor(private readonly operations: OperationsRepository) {}

  sellerOrders(userId: string) {
    return this.operations.sellerOrders(userId);
  }

  sellerFinance(userId: string) {
    return this.operations.sellerFinance(userId);
  }

  buyerOrders(userId: string) {
    return this.operations.buyerOrders(userId);
  }

  order(userId: string, orderId: string) {
    return this.operations.orderDetails(userId, orderId).then((order) => {
      if (!order) throw new NotFoundException('Order was not found.');
      return order;
    });
  }

  processOrder(userId: string, orderId: string) {
    return this.operations.processOrder(userId, orderId).then((order) => {
      if (!order) {
        throw new ConflictException({
          code: 'ORDER_NOT_PACKING',
          detail: 'Only an owned order in PACKING can be processed.',
        });
      }
      return order;
    });
  }

  async jobs(limit: number, encodedCursor?: string) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50.');
    }
    const cursor = encodedCursor ? this.decodeCursor(encodedCursor) : undefined;
    const rows = await this.operations.availableJobs(
      Math.min(limit, 50),
      cursor,
    );
    const last = rows.at(-1) as
      | { id: string; createdAt?: string; created_at?: string }
      | undefined;
    return {
      data: rows,
      nextCursor:
        rows.length === Math.min(limit, 50) && last
          ? Buffer.from(
              JSON.stringify({
                id: last.id,
                createdAt: last.createdAt ?? last.created_at,
              }),
            ).toString('base64url')
          : null,
    };
  }

  driverDeliveries(userId: string) {
    return this.operations.driverDeliveries(userId);
  }

  claim(userId: string, jobId: string, key?: string) {
    if (!key || !/^[A-Za-z0-9:_-]{8,100}$/.test(key)) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        detail: 'A valid Idempotency-Key header is required.',
      });
    }
    return this.operations.claimJob(userId, jobId, key).then((result) => {
      if (result.status === 'DRIVER_NOT_FOUND') {
        throw new NotFoundException('Driver profile was not found.');
      }
      if (result.status === 'JOB_ALREADY_CLAIMED') {
        throw new ConflictException({
          code: result.status,
          detail: 'The delivery job has already been claimed.',
        });
      }
      if (result.status === 'IDEMPOTENCY_CONFLICT') {
        throw new ConflictException({
          code: result.status,
          detail: 'The idempotency key belongs to another delivery claim.',
        });
      }
      return result;
    });
  }

  pickup(userId: string, deliveryId: string) {
    return this.transition(
      this.operations.pickup(userId, deliveryId),
      'Delivery cannot be picked up from its current state.',
    );
  }

  deliver(userId: string, deliveryId: string) {
    return this.transition(
      this.operations.completeDelivery(userId, deliveryId),
      'Delivery cannot be completed from its current state.',
    );
  }

  confirm(userId: string, orderId: string) {
    return this.transition(
      this.operations.confirmOrder(userId, orderId),
      'Order cannot be confirmed from its current state.',
    );
  }

  earnings(userId: string) {
    return this.operations.driverEarnings(userId);
  }

  private async transition<T>(operation: Promise<T | null>, detail: string) {
    const result = await operation;
    if (!result) {
      throw new ConflictException({ code: 'INVALID_STATE', detail });
    }
    return result;
  }

  private decodeCursor(value: string): { id: string; createdAt: string } {
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as {
        id?: string;
        createdAt?: string;
      };
      if (
        !parsed.id ||
        !/^[0-9a-f-]{36}$/i.test(parsed.id) ||
        !parsed.createdAt ||
        Number.isNaN(Date.parse(parsed.createdAt))
      )
        throw new Error('Invalid cursor');
      return { id: parsed.id, createdAt: parsed.createdAt };
    } catch {
      throw new BadRequestException('The cursor is invalid.');
    }
  }
}
