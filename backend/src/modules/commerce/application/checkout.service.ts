import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CheckoutRequestDto } from './checkout.dto';
import {
  CheckoutData,
  CheckoutRepository,
} from '../infrastructure/checkout.repository';
import { DeliveryMethod, PriceResult } from '../domain/pricing.engine';

@Injectable()
export class CheckoutService {
  constructor(private readonly checkouts: CheckoutRepository) {}

  async quote(userId: string, dto: CheckoutRequestDto) {
    const deliveries = this.deliveries(dto);
    const data = await this.checkouts.quote(
      userId,
      dto.addressId,
      dto.voucherCode,
    );
    this.validate(data, deliveries, Boolean(dto.voucherCode));
    return this.presentPrice(this.checkouts.calculate(data, deliveries));
  }

  async checkout(
    userId: string,
    dto: CheckoutRequestDto,
    idempotencyHeader: string | undefined,
  ) {
    const idempotencyKey = this.idempotencyKey(idempotencyHeader);
    const deliveries = this.deliveries(dto);
    const result = await this.checkouts.checkout({
      userId,
      addressId: dto.addressId,
      voucherCode: dto.voucherCode?.trim().toUpperCase(),
      deliveries,
      idempotencyKey,
      fingerprint: this.fingerprint(dto, deliveries),
    });
    if (result.status !== 'OK') this.throwStatus(result.status);
    const checkout = await this.checkouts.checkoutView(
      userId,
      result.checkoutId,
    );
    if (!checkout) throw new Error('Committed checkout could not be loaded');
    return checkout;
  }

  private validate(
    data: CheckoutData,
    deliveries: Map<string, DeliveryMethod>,
    voucherRequested: boolean,
  ) {
    if (!data.address) this.throwStatus('ADDRESS_NOT_FOUND');
    if (!data.lines.length) this.throwStatus('EMPTY_CART');
    if (voucherRequested && !data.voucher) this.throwStatus('VOUCHER_INVALID');
    if (data.lines.some((line) => line.available_quantity < line.quantity)) {
      this.throwStatus('INSUFFICIENT_STOCK');
    }
    if (
      data.lines.some(
        (line) =>
          line.product_status !== 'ACTIVE' ||
          line.variant_status !== 'ACTIVE' ||
          line.store_status !== 'ACTIVE',
      )
    ) {
      this.throwStatus('PRODUCT_UNAVAILABLE');
    }
    const storeIds = new Set(data.lines.map((line) => line.store_id));
    if (
      storeIds.size !== deliveries.size ||
      [...storeIds].some((id) => !deliveries.has(id))
    ) {
      this.throwStatus('DELIVERY_SELECTION_INVALID');
    }
  }

  private deliveries(dto: CheckoutRequestDto): Map<string, DeliveryMethod> {
    const result = new Map(
      dto.deliveries.map((choice) => [choice.storeId, choice.method]),
    );
    if (result.size !== dto.deliveries.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_DELIVERY_STORE',
        detail: 'Each store must have one delivery method.',
      });
    }
    return result;
  }

  private presentPrice(price: PriceResult) {
    return {
      stores: price.stores.map((store) => ({
        storeId: store.storeId,
        subtotalAmount: String(store.subtotal),
        discountAmount: String(store.discount),
        shippingAmount: String(store.shipping),
        totalAmount: String(store.total),
      })),
      subtotalAmount: String(price.subtotal),
      discountAmount: String(price.discount),
      shippingAmount: String(price.shipping),
      totalAmount: String(price.total),
    };
  }

  private fingerprint(
    dto: CheckoutRequestDto,
    deliveries: Map<string, DeliveryMethod>,
  ): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          addressId: dto.addressId,
          voucherCode: dto.voucherCode?.trim().toUpperCase() ?? null,
          deliveries: [...deliveries.entries()].sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        }),
      )
      .digest('hex');
  }

  private idempotencyKey(value: string | undefined): string {
    if (!value || !/^[A-Za-z0-9:_-]{8,100}$/.test(value)) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        detail: 'A valid Idempotency-Key header is required.',
      });
    }
    return value;
  }

  private throwStatus(status: string): never {
    if (status === 'ADDRESS_NOT_FOUND') {
      throw new NotFoundException({
        code: status,
        detail: 'The address does not exist.',
      });
    }
    if (status === 'IDEMPOTENCY_CONFLICT') {
      throw new ConflictException({
        code: status,
        detail: 'The idempotency key was used with different input.',
      });
    }
    const details: Record<string, string> = {
      EMPTY_CART: 'The active cart is empty.',
      VOUCHER_INVALID: 'The voucher is invalid, expired, or exhausted.',
      INSUFFICIENT_STOCK: 'One or more items no longer have sufficient stock.',
      INSUFFICIENT_BALANCE: 'The wallet balance is insufficient.',
      DELIVERY_SELECTION_INVALID:
        'A delivery method is required for every store.',
      PRODUCT_UNAVAILABLE: 'One or more products are no longer available.',
    };
    throw new UnprocessableEntityException({
      code: status,
      detail: details[status] ?? 'Checkout failed.',
    });
  }
}
