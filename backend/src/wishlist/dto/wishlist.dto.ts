import { IsInt, Min } from 'class-validator';

export class ToggleWishlistDto {
  @IsInt()
  @Min(1)
  productId: number;
}
