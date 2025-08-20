import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: any, sellerId: number) {
    console.log('Creating product with data:', {
      name: data.name,
      price: data.price,
      stock: data.stock,
      imageUrl: data.imageUrl,
      sellerId,
    });
    try {
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          stock: data.stock,
          imageUrl: data.imageUrl,
          sellerId,
        },
      });
      console.log('Product created:', product);
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
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
