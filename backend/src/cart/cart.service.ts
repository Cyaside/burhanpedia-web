import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, CartItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: { include: { images: true; category: true } };
    variant: true;
  };
}>;

type CartItemWithUnitPrice = CartItemWithRelations & {
  unitPrice: number;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private attachUnitPrice(item: CartItemWithRelations): CartItemWithUnitPrice {
    return {
      ...item,
      unitPrice: item.product.price + (item.variant?.priceDelta || 0),
    };
  }

  private findCartItemWithRelations(
    id: number,
  ): Promise<CartItemWithRelations | null> {
    return this.prisma.cartItem.findUnique({
      where: { id },
      include: {
        product: { include: { images: true, category: true } },
        variant: true,
      },
    });
  }

  private async getBuyerId(userId: number): Promise<number> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Buyer profile not found');
    }
    return profile.id;
  }

  async list(userId: number): Promise<CartItemWithUnitPrice[]> {
    const buyerId = await this.getBuyerId(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { buyerId },
      include: {
        product: { include: { images: true, category: true } },
        variant: true,
      },
    });
    return items.map((item) => this.attachUnitPrice(item));
  }

  async add(
    userId: number,
    payload: {
      productId: number;
      variantId?: number | null;
      quantity?: number;
    },
  ): Promise<CartItemWithUnitPrice | CartItem> {
    const buyerId = await this.getBuyerId(userId);
    const quantity =
      payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        buyerId,
        productId: payload.productId,
        variantId: payload.variantId ?? undefined,
      },
    });
    if (existing) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      const fullItem = await this.findCartItemWithRelations(updated.id);
      return fullItem ? this.attachUnitPrice(fullItem) : updated;
    }
    const created = await this.prisma.cartItem.create({
      data: {
        buyerId,
        productId: payload.productId,
        variantId: payload.variantId ?? undefined,
        quantity,
      },
    });
    const fullItem = await this.findCartItemWithRelations(created.id);
    return fullItem ? this.attachUnitPrice(fullItem) : created;
  }

  async updateQuantity(
    userId: number,
    id: number,
    quantity: number,
  ): Promise<CartItemWithUnitPrice | CartItem> {
    if (quantity < 1)
      throw new BadRequestException('Quantity must be at least 1');
    const buyerId = await this.getBuyerId(userId);
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.buyerId !== buyerId)
      throw new BadRequestException('Item not found');
    const updated = await this.prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
    const fullItem = await this.findCartItemWithRelations(updated.id);
    return fullItem ? this.attachUnitPrice(fullItem) : updated;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    const buyerId = await this.getBuyerId(userId);
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.buyerId !== buyerId)
      throw new BadRequestException('Item not found');
    await this.prisma.cartItem.delete({ where: { id } });
    return { success: true };
  }
}
