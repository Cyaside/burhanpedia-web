import {
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class RequestImageUploadDto {
  @IsIn(IMAGE_TYPES)
  contentType!: (typeof IMAGE_TYPES)[number];

  @IsInt()
  @Min(1)
  @Max(MAX_IMAGE_BYTES)
  byteSize!: number;

  @Matches(/^[0-9a-f]{64}$/)
  checksumSha256!: string;
}

export class CompleteImageUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  altText!: string;
}
