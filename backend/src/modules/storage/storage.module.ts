import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import {
  ImageUploadController,
  StoreLogoUploadController,
} from './image-upload.controller';
import { ImageUploadService } from './image-upload.service';
import { S3StorageAdapter } from './s3-storage.adapter';
import { STORAGE_PORT } from './storage.port';

@Module({
  imports: [CatalogModule],
  controllers: [ImageUploadController, StoreLogoUploadController],
  providers: [
    ImageUploadService,
    { provide: STORAGE_PORT, useClass: S3StorageAdapter },
  ],
})
export class StorageModule {}
