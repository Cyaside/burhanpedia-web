import { createHash, randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import sharp from 'sharp';
import { DatabaseService } from '../../database/database.service';
import { SellerRepository } from '../catalog/infrastructure/seller.repository';
import {
  CompleteImageUploadDto,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  RequestImageUploadDto,
} from './image-upload.dto';
import { STORAGE_PORT } from './storage.port';
import type { StoragePort } from './storage.port';

interface StoredObjectRow {
  id: string;
  storage_key: string;
  content_type: string;
  byte_size: string;
  checksum_sha256: string;
  status: 'PENDING' | 'READY' | 'REJECTED' | 'DELETED';
  expires_at: Date | null;
}

interface ProductImageRow {
  id: string;
  public_url: string;
  alt_text: string;
  position: number;
}

interface StoreLogoRow {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  logo_alt_text: string;
}

const FORMAT_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

@Injectable()
export class ImageUploadService {
  constructor(
    private readonly database: DatabaseService,
    private readonly sellers: SellerRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async requestUpload(
    userId: string,
    productId: string,
    dto: RequestImageUploadDto,
  ) {
    if (!(await this.sellers.ownsProduct(userId, productId))) {
      throw this.productNotFound();
    }
    const key = `products/${productId}/${randomUUID()}`;
    return this.createPendingUpload(userId, key, dto);
  }

  async requestStoreLogoUpload(userId: string, dto: RequestImageUploadDto) {
    const store = await this.sellers.storeForUser(userId);
    if (!store) throw this.storeNotFound();
    const key = `stores/${store.id}/logo/${randomUUID()}`;
    return this.createPendingUpload(userId, key, dto);
  }

  async completeUpload(
    userId: string,
    productId: string,
    uploadId: string,
    dto: CompleteImageUploadDto,
  ) {
    const object = await this.findObject(userId, productId, uploadId);
    if (!object) throw this.uploadNotFound();
    if (object.status === 'READY') {
      const existing = await this.database.query<ProductImageRow>(
        'SELECT id, public_url, alt_text, position FROM product_images WHERE storage_key = $1',
        [object.storage_key],
      );
      if (existing.rows[0]) return this.present(existing.rows[0]);
    }
    if (
      object.status !== 'PENDING' ||
      !object.expires_at ||
      object.expires_at <= new Date()
    ) {
      throw this.invalidUpload('The upload has expired or is not pending.');
    }

    await this.validateStoredImage(object);

    return this.database.withTransaction(async (client) => {
      const product = await client.query(
        `SELECT p.id FROM products p
         JOIN stores s ON s.id = p.store_id
         JOIN seller_profiles sp ON sp.id = s.seller_profile_id
         WHERE p.id = $2 AND sp.user_id = $1 FOR UPDATE OF p`,
        [userId, productId],
      );
      if (!product.rowCount) throw this.productNotFound();
      const stored = await client.query<StoredObjectRow>(
        `SELECT id, storage_key, content_type, byte_size,
                checksum_sha256, status, expires_at
         FROM stored_objects WHERE id = $1 AND owner_user_id = $2
         FOR UPDATE`,
        [uploadId, userId],
      );
      const current = stored.rows[0];
      if (!current || current.storage_key !== object.storage_key) {
        throw this.uploadNotFound();
      }
      if (current.status === 'READY') {
        const existing = await client.query<ProductImageRow>(
          'SELECT id, public_url, alt_text, position FROM product_images WHERE storage_key = $1',
          [object.storage_key],
        );
        if (existing.rows[0]) return this.present(existing.rows[0]);
      }
      if (
        current.status !== 'PENDING' ||
        (current.expires_at && current.expires_at <= new Date())
      ) {
        throw this.invalidUpload('The upload has expired or is not pending.');
      }
      const position = await client.query<{ next_position: number }>(
        `SELECT coalesce(max(position) + 1, 0)::integer AS next_position
         FROM product_images WHERE product_id = $1`,
        [productId],
      );
      const image = await client.query<ProductImageRow>(
        `INSERT INTO product_images
         (product_id, storage_key, public_url, alt_text, position)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, public_url, alt_text, position`,
        [
          productId,
          object.storage_key,
          this.storage.publicUrl(object.storage_key),
          dto.altText,
          position.rows[0].next_position,
        ],
      );
      await client.query(
        "UPDATE stored_objects SET status = 'READY' WHERE id = $1",
        [uploadId],
      );
      return this.present(image.rows[0]);
    });
  }

  async completeStoreLogoUpload(
    userId: string,
    uploadId: string,
    dto: CompleteImageUploadDto,
  ) {
    const store = await this.sellers.storeForUser(userId);
    if (!store) throw this.storeNotFound();
    const object = await this.findPendingObject(
      userId,
      uploadId,
      `stores/${store.id}/logo/%`,
    );
    if (!object) throw this.uploadNotFound();
    if (object.status === 'READY') {
      const current = await this.currentStoreLogo(userId, object.storage_key);
      if (current) return this.presentStoreLogo(current);
    }
    if (
      object.status !== 'PENDING' ||
      !object.expires_at ||
      object.expires_at <= new Date()
    ) {
      throw this.invalidUpload('The upload has expired or is not pending.');
    }
    await this.validateStoredImage(object);

    return this.database.withTransaction(async (client) => {
      const lockedStore = await client.query<{
        id: string;
        logo_storage_key: string | null;
      }>(
        `SELECT s.id, s.logo_storage_key
         FROM stores s
         JOIN seller_profiles sp ON sp.id = s.seller_profile_id
         WHERE sp.user_id = $1 FOR UPDATE OF s`,
        [userId],
      );
      if (!lockedStore.rows[0]) throw this.storeNotFound();
      const stored = await client.query<StoredObjectRow>(
        `SELECT id, storage_key, content_type, byte_size,
                checksum_sha256, status, expires_at
         FROM stored_objects WHERE id = $1 AND owner_user_id = $2
         FOR UPDATE`,
        [uploadId, userId],
      );
      const current = stored.rows[0];
      if (!current || current.storage_key !== object.storage_key) {
        throw this.uploadNotFound();
      }
      if (current.status === 'READY') {
        const existing = await client.query<StoreLogoRow>(
          `SELECT id, slug, name, logo_url, logo_alt_text
           FROM stores WHERE id = $1 AND logo_storage_key = $2`,
          [lockedStore.rows[0].id, current.storage_key],
        );
        if (existing.rows[0]) return this.presentStoreLogo(existing.rows[0]);
      }
      if (
        current.status !== 'PENDING' ||
        (current.expires_at && current.expires_at <= new Date())
      ) {
        throw this.invalidUpload('The upload has expired or is not pending.');
      }
      const logo = await client.query<StoreLogoRow>(
        `UPDATE stores
         SET logo_storage_key = $2, logo_url = $3, logo_alt_text = $4
         WHERE id = $1
         RETURNING id, slug, name, logo_url, logo_alt_text`,
        [
          lockedStore.rows[0].id,
          current.storage_key,
          this.storage.publicUrl(current.storage_key),
          dto.altText,
        ],
      );
      await client.query(
        "UPDATE stored_objects SET status = 'READY' WHERE id = $1",
        [uploadId],
      );
      if (
        lockedStore.rows[0].logo_storage_key &&
        lockedStore.rows[0].logo_storage_key !== current.storage_key
      ) {
        await client.query(
          `UPDATE stored_objects SET status = 'DELETED'
           WHERE storage_key = $1 AND owner_user_id = $2`,
          [lockedStore.rows[0].logo_storage_key, userId],
        );
      }
      return this.presentStoreLogo(logo.rows[0]);
    });
  }

  private async createPendingUpload(
    userId: string,
    key: string,
    dto: RequestImageUploadDto,
  ) {
    const signed = await this.storage.signUpload(key, dto.contentType);
    const result = await this.database.query<{ id: string; expires_at: Date }>(
      `INSERT INTO stored_objects
       (owner_user_id, storage_key, content_type, byte_size,
        checksum_sha256, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '10 minutes')
       RETURNING id, expires_at`,
      [userId, key, dto.contentType, dto.byteSize, dto.checksumSha256],
    );
    return {
      uploadId: result.rows[0].id,
      url: signed.url,
      headers: signed.headers,
      expiresAt: result.rows[0].expires_at.toISOString(),
    };
  }

  private async findObject(
    userId: string,
    productId: string,
    uploadId: string,
  ) {
    const result = await this.database.query<StoredObjectRow>(
      `SELECT id, storage_key, content_type, byte_size,
              checksum_sha256, status, expires_at
       FROM stored_objects
       WHERE id = $1 AND owner_user_id = $2
         AND storage_key LIKE $3`,
      [uploadId, userId, `products/${productId}/%`],
    );
    return result.rows[0] ?? null;
  }

  private async findPendingObject(
    userId: string,
    uploadId: string,
    storageKeyPattern: string,
  ) {
    const result = await this.database.query<StoredObjectRow>(
      `SELECT id, storage_key, content_type, byte_size,
              checksum_sha256, status, expires_at
       FROM stored_objects
       WHERE id = $1 AND owner_user_id = $2 AND storage_key LIKE $3`,
      [uploadId, userId, storageKeyPattern],
    );
    return result.rows[0] ?? null;
  }

  private async currentStoreLogo(userId: string, storageKey: string) {
    const result = await this.database.query<StoreLogoRow>(
      `SELECT s.id, s.slug, s.name, s.logo_url, s.logo_alt_text
       FROM stores s
       JOIN seller_profiles sp ON sp.id = s.seller_profile_id
       WHERE sp.user_id = $1 AND s.logo_storage_key = $2`,
      [userId, storageKey],
    );
    return result.rows[0] ?? null;
  }

  private async validateStoredImage(object: StoredObjectRow): Promise<void> {
    let bytes: Buffer;
    try {
      bytes = await this.storage.load(object.storage_key, MAX_IMAGE_BYTES);
    } catch (error) {
      if (error instanceof UnprocessableEntityException) throw error;
      const status = this.storageStatus(error);
      if (status === 404) {
        throw this.invalidUpload('The uploaded object was not found.');
      }
      throw new ServiceUnavailableException({
        code: 'STORAGE_UNAVAILABLE',
        detail: 'Image storage is temporarily unavailable.',
      });
    }
    if (bytes.length !== Number(object.byte_size)) {
      throw this.invalidUpload('The uploaded size does not match the request.');
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== object.checksum_sha256) {
      throw this.invalidUpload('The uploaded checksum does not match.');
    }
    try {
      const metadata = await sharp(bytes, {
        limitInputPixels: 36_000_000,
      }).metadata();
      if (
        !metadata.format ||
        !metadata.width ||
        !metadata.height ||
        metadata.width < 256 ||
        metadata.height < 256 ||
        metadata.width > 6000 ||
        metadata.height > 6000 ||
        FORMAT_MIME[metadata.format] !== object.content_type ||
        !IMAGE_TYPES.includes(
          object.content_type as (typeof IMAGE_TYPES)[number],
        )
      ) {
        throw this.invalidUpload(
          'The uploaded image format or dimensions are invalid.',
        );
      }
      await sharp(bytes, { limitInputPixels: 36_000_000 })
        .resize(1, 1)
        .toBuffer();
    } catch (error) {
      if (error instanceof UnprocessableEntityException) throw error;
      throw this.invalidUpload('The uploaded object is not a valid image.');
    }
  }

  private storageStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const metadata = (error as { $metadata?: unknown }).$metadata;
    if (typeof metadata !== 'object' || metadata === null) return undefined;
    const status = (metadata as { httpStatusCode?: unknown }).httpStatusCode;
    return typeof status === 'number' ? status : undefined;
  }

  private present(row: ProductImageRow) {
    return {
      id: row.id,
      url: row.public_url,
      altText: row.alt_text,
      position: row.position,
    };
  }

  private presentStoreLogo(row: StoreLogoRow) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      logoUrl: row.logo_url,
      logoAltText: row.logo_alt_text,
    };
  }

  private productNotFound() {
    return new NotFoundException({
      code: 'PRODUCT_NOT_FOUND',
      detail: 'The product does not exist.',
    });
  }

  private storeNotFound() {
    return new NotFoundException({
      code: 'STORE_NOT_FOUND',
      detail: 'The store does not exist.',
    });
  }

  private uploadNotFound() {
    return new NotFoundException({
      code: 'UPLOAD_NOT_FOUND',
      detail: 'The upload does not exist.',
    });
  }

  private invalidUpload(detail: string) {
    return new UnprocessableEntityException({
      code: 'INVALID_IMAGE_UPLOAD',
      detail,
    });
  }
}
