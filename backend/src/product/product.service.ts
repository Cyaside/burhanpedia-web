import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveSellerProfileId(userIdOrSellerId: number) {
    const byUser = await this.prisma.sellerProfile.findUnique({
      where: { userId: userIdOrSellerId },
    });
    if (byUser) return byUser.id;

    const byId = await this.prisma.sellerProfile.findUnique({
      where: { id: userIdOrSellerId },
    });
    if (byId) return byId.id;

    throw new BadRequestException('Seller profile not found');
  }

  private buildSlug(name: string) {
    return (
      slugify(name, { lower: true, strict: true }) +
      '-' +
      Math.random().toString(36).slice(2, 6)
    );
  }

  async createProduct(data: any, userId: number) {
    const sellerId = await this.resolveSellerProfileId(userId);
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
        // set scalar foreign key directly to match generated Prisma types
        categoryId: data.categoryId ?? undefined,
      },
    });
    return product;
  }

  addImages(productId: number, urls: string[]) {
    const createInputs = urls.map((url, index) => ({
      url,
      isPrimary: index === 0,
      productId,
    }));
    return this.prisma.productImage.createMany({
      data: createInputs,
      skipDuplicates: true,
    });
  }

  addVariant(
    productId: number,
    payload: {
      color?: string;
      size?: string;
      sku?: string;
      stock: number;
      priceDelta?: number;
    },
  ) {
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

  getAllProducts(params?: {
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

  getBySlug(slug: string) {
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
    const resolvedSellerId = await this.resolveSellerProfileId(sellerId);
    return this.prisma.product.findMany({
      where: { sellerId: resolvedSellerId },
      include: { seller: true, images: true, variants: true },
    });
  }
}
