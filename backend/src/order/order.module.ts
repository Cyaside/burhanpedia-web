import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CartService } from '../cart/cart.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, CartService],
  exports: [OrderService],
})
export class OrderModule {}
