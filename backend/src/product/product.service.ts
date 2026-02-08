import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 6);
  }

  async createProduct(data: any, sellerId: number) {
    const slug = this.buildSlug(data.name);
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? '',
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        sellerId,
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
      },
    });
    return product;
  }

  async addImages(productId: number, urls: string[]) {
    const createInputs = urls.map((url, index) => ({
      url,
      isPrimary: index === 0,
      productId,
    }));
    return this.prisma.productImage.createMany({ data: createInputs, skipDuplicates: true });
  }

  async addVariant(productId: number, payload: { color?: string; size?: string; sku?: string; stock: number; priceDelta?: number }) {
    return this.prisma.productVariant.create({
      data: {
        productId,
        color: payload.color,
        size: payload.size,
        sku: payload.sku,
        stock: payload.stock,
        priceDelta: payload.priceDelta ?? 0,
      },
    });
  }

  async getAllProducts(params?: {
    q?: string;
    category?: string;
    rating?: number;
    priceMin?: number;
    priceMax?: number;
  }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};
    if (params?.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params?.category) {
      where.category = { slug: params.category };
    }
    if (params?.rating) {
      where.ratingAvg = { gte: params.rating };
    }
    if (params?.priceMin || params?.priceMax) {
      where.price = {
        gte: params.priceMin ?? undefined,
        lte: params.priceMax ?? undefined,
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        variants: true,
        reviews: {
          include: { buyer: { include: { user: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getSellerProducts(sellerId: number) {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { seller: true, images: true, variants: true },
    });
  }
}
