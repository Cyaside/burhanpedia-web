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
  async createProduct(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    // req.body: { name, price, stock }
    // file: image file
    try {
      const sellerId = req.user.userId;
      const { name, price, stock } = req.body;
      const imageUrl = file ? file.originalname : '';
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
