import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DatabaseError } from 'pg';
import { OperationsRepository } from '../infrastructure/operations.repository';
import { CreateVoucherDto } from './admin-operations.dto';

@Injectable()
export class AdminOperationsService {
  constructor(private readonly operations: OperationsRepository) {}

  overview() {
    return this.operations.adminOverview();
  }

  async createVoucher(userId: string, input: CreateVoucherDto) {
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new BadRequestException({
        code: 'INVALID_VOUCHER_WINDOW',
        detail: 'Voucher end time must be later than its start time.',
      });
    }
    const validValue =
      (input.kind === 'FIXED' &&
        input.valueAmount &&
        BigInt(input.valueAmount) > 0 &&
        !input.valueBasisPoints) ||
      (input.kind === 'PERCENTAGE' &&
        input.valueBasisPoints &&
        !input.valueAmount) ||
      (input.kind === 'FREE_SHIPPING' &&
        !input.valueAmount &&
        !input.valueBasisPoints);
    if (!validValue) {
      throw new BadRequestException({
        code: 'INVALID_VOUCHER_VALUE',
        detail: 'Voucher value does not match its discount type.',
      });
    }
    if (
      input.maximumDiscountAmount !== undefined &&
      BigInt(input.maximumDiscountAmount) <= 0
    ) {
      throw new BadRequestException({
        code: 'INVALID_VOUCHER_MAXIMUM',
        detail: 'Maximum discount must be positive when provided.',
      });
    }
    try {
      return await this.operations.createVoucher(userId, input);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throw new ConflictException({
          code: 'VOUCHER_CODE_EXISTS',
          detail: 'The voucher code already exists.',
        });
      }
      throw error;
    }
  }
}
