import { BadRequestException, Injectable } from '@nestjs/common';
import { BuyerProfile, Order, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: { include: { product: true } };
    address: true;
    payment: true;
  };
}>;

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerProfile(userId: number): Promise<BuyerProfile> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile;
  }

  async list(userId: number): Promise<OrderWithRelations[]> {
    const buyer = await this.getBuyerProfile(userId);
    return this.prisma.order.findMany({
      where: { buyerId: buyer.id },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromCart(
    userId: number,
    addressId: number,
  ): Promise<OrderWithRelations> {
    const buyer = await this.getBuyerProfile(userId);
    const cartItems = await this.prisma.cartItem.findMany({
      where: { buyerId: buyer.id },
      include: { product: true, variant: true },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    const subTotal = cartItems.reduce(
      (sum, item) =>
        sum +
        item.quantity * (item.product.price + (item.variant?.priceDelta || 0)),
      0,
    );
    const shippingFee = 20000;
    const total = subTotal + shippingFee;

    if (buyer.balance < total) {
      throw new BadRequestException('Insufficient balance');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId: buyer.id,
          addressId,
          status: 'pending',
          subTotal,
          shippingFee,
          total,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? undefined,
              quantity: item.quantity,
              unitPrice: item.product.price + (item.variant?.priceDelta || 0),
            })),
          },
          payment: {
            create: {
              amount: total,
              status: 'paid',
              provider: 'mock',
              method: 'virtual',
              paidAt: new Date(),
            },
          },
        },
        include: { items: { include: { product: true } }, payment: true, address: true },
      });

      await tx.buyerProfile.update({
        where: { id: buyer.id },
        data: { balance: { decrement: total } },
      });
      await tx.walletTransaction.create({
        data: {
          buyerId: buyer.id,
          type: 'PURCHASE',
          amount: total,
          note: `Order #${createdOrder.id}`,
        },
      });

      const sellerTotals = new Map<number, number>();
      for (const item of cartItems) {
        const sellerId = item.product.sellerId;
        const lineTotal =
          item.quantity *
          (item.product.price + (item.variant?.priceDelta || 0));
        sellerTotals.set(
          sellerId,
          (sellerTotals.get(sellerId) || 0) + lineTotal,
        );
      }

      for (const [sellerId, amount] of sellerTotals.entries()) {
        await tx.sellerProfile.update({
          where: { id: sellerId },
          data: { balance: { increment: amount } },
        });
        await tx.sellerTransaction.create({
          data: {
            sellerId,
            orderId: createdOrder.id,
            type: 'SALE',
            amount,
            note: `Order #${createdOrder.id}`,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { buyerId: buyer.id } });
      return createdOrder;
    });

    return order;
  }

  updateStatus(id: number, status: string): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
