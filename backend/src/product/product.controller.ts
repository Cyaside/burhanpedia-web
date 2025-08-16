import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@Body() body: any, @Request() req: any) {
    // body: { name, price, stock, imageUrl }
    return this.productService.createProduct(body, req.user.id);
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
