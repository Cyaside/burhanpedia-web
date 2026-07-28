import { Module } from '@nestjs/common';
import { CartService } from './application/cart.service';
import { CartRepository } from './infrastructure/cart.repository';
import {
  AddressController,
  CartController,
} from './presentation/cart.controller';
import { WalletRepository } from './infrastructure/wallet.repository';
import { WalletService } from './application/wallet.service';
import { WalletController } from './presentation/wallet.controller';

@Module({
  controllers: [CartController, AddressController, WalletController],
  providers: [CartRepository, CartService, WalletRepository, WalletService],
  exports: [CartRepository, WalletRepository],
})
export class CommerceModule {}
