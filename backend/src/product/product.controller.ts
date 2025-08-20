import { Controller, Get, Post, Body, UseGuards, Request, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage, memoryStorage } from 'multer';
import { supabase } from 'src/supabaseClient';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

@UseGuards(JwtAuthGuard)
@Post()
@UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
async createProduct(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
  try {
    const sellerId = req.user.userId;
    const { name, price, stock } = req.body;
    let imageUrl = '';

    if (file) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const productData = {
      name,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
    };

    const product = await this.productService.createProduct(productData, sellerId);
    return product;
  } catch (error) {
    return {
      statusCode: 500,
      message: error?.message || 'Failed to create product',
      error,
    };
  }
}

  @Get()
  async getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Get('seller/:sellerId')
  async getSellerProducts(@Param('sellerId') sellerId: number) {
    return this.productService.getSellerProducts(Number(sellerId));
  }
}
