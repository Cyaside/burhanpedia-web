import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, SellerTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SellerOrderItem = Prisma.OrderItemGetPayload<{
  include: {
    order: { include: { address: true; buyer: { include: { user: true } } } };
    product: true;
    variant: true;
  };
}>;

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSellerId(userId: number): Promise<number> {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Seller profile not found');
    }
    return profile.id;
  }

  async listOrders(userId: number): Promise<SellerOrderItem[]> {
    const sellerId = await this.getSellerId(userId);
    return this.prisma.orderItem.findMany({
      where: { product: { sellerId } },
      include: {
        order: {
          include: { address: true, buyer: { include: { user: true } } },
        },
        product: true,
        variant: true,
      },
      orderBy: { orderId: 'desc' },
    });
  }

  async listTransactions(userId: number): Promise<SellerTransaction[]> {
    const sellerId = await this.getSellerId(userId);
    return this.prisma.sellerTransaction.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBalance(userId: number): Promise<{ balance: number }> {
    const sellerId = await this.getSellerId(userId);
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: { balance: true },
    });
    return { balance: seller?.balance ?? 0 };
  }
}
