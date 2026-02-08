import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile.id;
  }

  async list(userId: number) {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.order.findMany({
      where: { buyerId },
      include: { items: { include: { product: true } }, address: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromCart(userId: number, addressId: number) {
    const buyerId = await this.getBuyerId(userId);
    const cartItems = await this.prisma.cartItem.findMany({
      where: { buyerId },
      include: { product: true, variant: true },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    const subTotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * (item.product.price + (item.variant?.priceDelta || 0)),
      0,
    );
    const shippingFee = 20000;
    const total = subTotal + shippingFee;

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId,
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
        include: { items: { include: { product: true } }, payment: true },
      });

      await tx.cartItem.deleteMany({ where: { buyerId } });
      return createdOrder;
    });

    return order;
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
