import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: any, sellerId: number) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        sellerId,
      },
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: { seller: true },
    });
  }

  async getSellerProducts(sellerId: number) {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { seller: true },
    });
  }
}
