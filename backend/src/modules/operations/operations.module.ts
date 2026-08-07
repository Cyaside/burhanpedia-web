import { Module } from '@nestjs/common';
import { OperationsService } from './application/operations.service';
import { ClockService } from './application/clock.service';
import { OrderStateMachine } from './domain/order-state-machine';
import { OperationsRepository } from './infrastructure/operations.repository';
import {
  BuyerOrdersController,
  DriverOperationsController,
  SellerOrdersController,
} from './presentation/operations.controller';
import { ClockController } from './presentation/clock.controller';
import { AdminOperationsController } from './presentation/admin-operations.controller';
import { AdminOperationsService } from './application/admin-operations.service';

@Module({
  controllers: [
    SellerOrdersController,
    DriverOperationsController,
    BuyerOrdersController,
    ClockController,
    AdminOperationsController,
  ],
  providers: [
    OrderStateMachine,
    OperationsRepository,
    OperationsService,
    ClockService,
    AdminOperationsService,
  ],
  exports: [OrderStateMachine, ClockService],
})
export class OperationsModule {}
