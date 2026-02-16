import { IsInt, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  addressId: number;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
