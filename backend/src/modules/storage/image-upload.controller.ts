import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/security/current-user.decorator';
import { RequireRoles } from '../../common/security/roles.decorator';
import { AppRole } from '../identity/domain/identity.types';
import type { SessionPrincipal } from '../identity/domain/identity.types';
import {
  CompleteImageUploadDto,
  RequestImageUploadDto,
} from './image-upload.dto';
import { ImageUploadService } from './image-upload.service';

@RequireRoles(AppRole.SELLER)
@Controller('seller/products/:productId/images')
export class ImageUploadController {
  constructor(private readonly uploads: ImageUploadService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('uploads')
  requestUpload(
    @CurrentUser() principal: SessionPrincipal,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: RequestImageUploadDto,
  ) {
    return this.uploads.requestUpload(principal.userId, productId, dto);
  }

  @Post('uploads/:uploadId/complete')
  completeUpload(
    @CurrentUser() principal: SessionPrincipal,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Body() dto: CompleteImageUploadDto,
  ) {
    return this.uploads.completeUpload(
      principal.userId,
      productId,
      uploadId,
      dto,
    );
  }
}

@RequireRoles(AppRole.SELLER)
@Controller('seller/store/logo')
export class StoreLogoUploadController {
  constructor(private readonly uploads: ImageUploadService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('uploads')
  requestUpload(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: RequestImageUploadDto,
  ) {
    return this.uploads.requestStoreLogoUpload(principal.userId, dto);
  }

  @Post('uploads/:uploadId/complete')
  completeUpload(
    @CurrentUser() principal: SessionPrincipal,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Body() dto: CompleteImageUploadDto,
  ) {
    return this.uploads.completeStoreLogoUpload(
      principal.userId,
      uploadId,
      dto,
    );
  }
}
