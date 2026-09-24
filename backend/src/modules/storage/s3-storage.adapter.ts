import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoragePort } from './storage.port';

@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') ?? '';
    this.publicBaseUrl = config.get<string>('S3_PUBLIC_BASE_URL') ?? '';
    const region = config.get<string>('S3_REGION');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    this.client =
      region && this.bucket && accessKeyId && secretAccessKey
        ? new S3Client({
            region,
            endpoint: config.get<string>('S3_ENDPOINT') || undefined,
            forcePathStyle: Boolean(config.get<string>('S3_ENDPOINT')),
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  async signUpload(
    key: string,
    contentType: string,
    byteSize: number,
    checksumSha256: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const client = this.requireClient();
    const checksum = Buffer.from(checksumSha256, 'hex').toString('base64');
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: byteSize,
        ChecksumSHA256: checksum,
      }),
      {
        expiresIn: 300,
        signableHeaders: new Set(['content-length', 'content-type']),
        unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
      },
    );
    return {
      url,
      headers: {
        'Content-Type': contentType,
        'x-amz-checksum-sha256': checksum,
      },
    };
  }

  async load(key: string, maximumBytes: number): Promise<Buffer> {
    const client = this.requireClient();
    const head = await client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!head.ContentLength || head.ContentLength > maximumBytes) {
      throw new UnprocessableEntityException({
        code: 'INVALID_IMAGE_UPLOAD',
        detail: 'The uploaded image size is invalid.',
      });
    }
    const object = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!object.Body) throw new Error('Stored image has no content');
    const bytes = Buffer.from(await object.Body.transformToByteArray());
    if (bytes.length > maximumBytes) {
      throw new UnprocessableEntityException({
        code: 'INVALID_IMAGE_UPLOAD',
        detail: 'The uploaded image size is invalid.',
      });
    }
    return bytes;
  }

  publicUrl(key: string): string {
    if (!this.publicBaseUrl) this.unavailable();
    const path = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${path}`;
  }

  private requireClient(): S3Client {
    return this.client ?? this.unavailable();
  }

  private unavailable(): never {
    throw new ServiceUnavailableException({
      code: 'STORAGE_NOT_CONFIGURED',
      detail: 'Image storage is not configured for this environment.',
    });
  }
}
