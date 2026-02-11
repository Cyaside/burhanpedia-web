import {
  Controller,
  Get,
  Post,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  BadRequestException,
  Query,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { supabase } from '../supabaseClient';
import { MulterExceptionFilter } from '../filters/multerexception.filter';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

function imageFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(
      new Error('Only image files (jpg, png, webp) are allowed'),
      false,
    );
  }
  cb(null, true);
}

@Controller('products')
@UseFilters(new MulterExceptionFilter())
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('recommended')
  async getRecommendedProducts(@Query('q') q?: string) {
    return this.productService.getAllProducts({ q });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const sellerUserId = req.user.userId;
    const { name, price, stock } = req.body;

    if (!name || !price || !stock) {
      throw new BadRequestException('name, price, and stock are required');
    }

    let imageUrl = '';
    if (file) {
      const fileExt = (file.originalname.split('.').pop() || 'jpg').replace(
        /[^a-zA-Z0-9]/g,
        '',
      );
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const pathInBucket = `products/${sellerUserId}/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(pathInBucket, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(
          `Image upload failed: ${error.message || JSON.stringify(error)}`,
        );
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(pathInBucket);
      imageUrl = data?.publicUrl || '';
    }

    const productData = {
      name,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
      description: req.body.description,
      categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
    };

    return this.productService.createProduct(productData, sellerUserId);
  }

  @Get()
  async getAllProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('rating') rating?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
  ) {
    return this.productService.getAllProducts({
      q,
      category,
      rating: rating ? Number(rating) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });
  }

  @Get('seller/:sellerId')
  async getSellerProducts(@Param('sellerId') sellerId: number) {
    return this.productService.getSellerProducts(Number(sellerId));
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const product = await this.productService.getBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') productId: string,
  ) {
    if (!file) throw new BadRequestException('Image required');
    const fileExt = (file.originalname.split('.').pop() || 'jpg').replace(
      /[^a-zA-Z0-9]/g,
      '',
    );
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const pathInBucket = `products/${productId}/${fileName}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(pathInBucket, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error) throw new BadRequestException(error.message);
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(pathInBucket);
    await this.productService.addImages(Number(productId), [
      data?.publicUrl || '',
    ]);
    return { url: data?.publicUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/variants')
  addVariant(
    @Param('id') productId: string,
    @Body()
    body: {
      color?: string;
      size?: string;
      sku?: string;
      stock: number;
      priceDelta?: number;
    },
  ) {
    return this.productService.addVariant(Number(productId), body);
  }
}
