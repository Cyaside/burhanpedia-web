import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Category,
  Prisma,
  Product,
  ProductImage,
  ProductVariant,
  SellerProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

type CreateProductInput = {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  description?: string;
  categoryId?: number;
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveSellerProfileId(
    userIdOrSellerId: number,
  ): Promise<number> {
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

  private buildSlug(name: string): string {
    return (
      slugify(name, { lower: true, strict: true }) +
      '-' +
      Math.random().toString(36).slice(2, 6)
    );
  }

  private async assertOwnership(
    userId: number,
    productId: number,
  ): Promise<{ sellerId: number; product: Product }> {
    const sellerId = await this.resolveSellerProfileId(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this product');
    }
    return { sellerId, product };
  }

  async createProduct(
    data: CreateProductInput,
    userId: number,
  ): Promise<Product> {
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

  addImages(productId: number, urls: string[]): Promise<Prisma.BatchPayload> {
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
  ): Promise<ProductVariant> {
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

  getBySlug(slug: string): Promise<
    | (Product & {
        category: Category | null;
        images: ProductImage[];
        variants: ProductVariant[];
        reviews: Prisma.ReviewGetPayload<{
          include: { buyer: { include: { user: true } } };
        }>[];
      })
    | null
  > {
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

  async getSellerProducts(sellerId: number): Promise<
    (Product & {
      seller: SellerProfile;
      category: Category | null;
      images: ProductImage[];
      variants: ProductVariant[];
    })[]
  > {
    const resolvedSellerId = await this.resolveSellerProfileId(sellerId);
    return this.prisma.product.findMany({
      where: { sellerId: resolvedSellerId },
      include: { seller: true, category: true, images: true, variants: true },
    });
  }

  async updateProduct(
    productId: number,
    userId: number,
    payload: {
      name?: string;
      description?: string | null;
      price?: number;
      stock?: number;
      categoryId?: number | null;
      imageUrl?: string;
    },
  ): Promise<Product> {
    await this.assertOwnership(userId, productId);
    const data: Prisma.ProductUpdateInput = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined)
      data.description = payload.description;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.stock !== undefined) data.stock = payload.stock;
    if (payload.categoryId !== undefined) {
      data.category =
        payload.categoryId === null
          ? { disconnect: true }
          : { connect: { id: payload.categoryId } };
    }
    if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl;

    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async deleteProduct(
    productId: number,
    userId: number,
  ): Promise<{ success: true }> {
    await this.assertOwnership(userId, productId);

    const orderItems = await this.prisma.orderItem.count({
      where: { productId },
    });
    if (orderItems > 0) {
      throw new BadRequestException(
        'Cannot delete product with existing orders',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId } });
      await tx.wishlist.deleteMany({ where: { productId } });
      await tx.review.deleteMany({ where: { productId } });
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productVariant.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });

    return { success: true };
  }
}
