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
import { PricingEngine } from './domain/pricing.engine';
import { CheckoutRepository } from './infrastructure/checkout.repository';
import { CheckoutService } from './application/checkout.service';
import { CheckoutController } from './presentation/checkout.controller';

@Module({
  controllers: [
    CartController,
    AddressController,
    WalletController,
    CheckoutController,
  ],
  providers: [
    CartRepository,
    CartService,
    WalletRepository,
    WalletService,
    PricingEngine,
    CheckoutRepository,
    CheckoutService,
  ],
  exports: [CartRepository, WalletRepository],
})
export class CommerceModule {}
