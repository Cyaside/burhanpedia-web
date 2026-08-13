import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { DeliveryMethod } from '../domain/pricing.engine';

const DELIVERY_METHODS: DeliveryMethod[] = ['INSTANT', 'NEXT_DAY', 'REGULAR'];

export class DeliveryChoiceDto {
  @IsUUID()
  storeId!: string;

  @IsIn(DELIVERY_METHODS)
  method!: DeliveryMethod;
}

export class CheckoutRequestDto {
  @IsUUID()
  addressId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  voucherCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DeliveryChoiceDto)
  deliveries!: DeliveryChoiceDto[];
}
