import { Controller, Get, Post, Body, UseGuards, Request, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createProduct(@UploadedFile() file: any, @Request() req: any) {
    // req.body: { name, price, stock }
    // file: image file
    try {
      const sellerId = req.user.userId;
      const { name, price, stock } = req.body;
      let imageUrl = '';
      if (file) {
        // Upload image to Supabase Storage
        const { supabase } = await import('../supabaseClient.js');
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });
        if (error) {
          return { statusCode: 500, message: 'Image upload failed', error };
        }
        imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
      }
      const productData = {
        name,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
      };
      const product = await this.productService.createProduct(productData, sellerId);
      if (!product?.id) {
        return {
          statusCode: 500,
          message: 'Product was not created in the database.',
        };
      }
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
