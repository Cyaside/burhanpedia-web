import { IsInt, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  variantId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
