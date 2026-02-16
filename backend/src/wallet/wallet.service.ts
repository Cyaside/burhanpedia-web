import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number): Promise<number> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Buyer profile not found');
    }
    return profile.id;
  }

  async topUp(
    userId: number,
    amount: number,
    note?: string,
  ): Promise<{ balance: number; transaction: WalletTransaction }> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.$transaction(async (tx) => {
      const updatedBuyer = await tx.buyerProfile.update({
        where: { id: buyerId },
        data: { balance: { increment: amount } },
      });
      const transaction = await tx.walletTransaction.create({
        data: {
          buyerId,
          type: 'TOPUP',
          amount,
          note,
        },
      });
      return { balance: updatedBuyer.balance, transaction };
    });
  }

  async listTransactions(userId: number): Promise<WalletTransaction[]> {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.walletTransaction.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
