import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3-storage.adapter';

describe('S3StorageAdapter signed uploads', () => {
  it('binds the requested content type, byte count, and checksum to the signature', async () => {
    const storage = new S3StorageAdapter(
      new ConfigService({
        S3_ENDPOINT: 'http://127.0.0.1:9000',
        S3_REGION: 'us-east-1',
        S3_BUCKET: 'test-images',
        S3_ACCESS_KEY_ID: 'test-access-key',
        S3_SECRET_ACCESS_KEY: 'test-secret-key',
      }),
    );
    const checksumHex = createHash('sha256').update('test').digest('hex');
    const signed = await storage.signUpload(
      'products/test/image',
      'image/png',
      4,
      checksumHex,
    );
    const url = new URL(signed.url);

    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe(
      'content-length;content-type;host;x-amz-checksum-sha256',
    );
    expect(url.searchParams.has('x-amz-checksum-sha256')).toBe(false);
    expect(signed.headers).toEqual({
      'Content-Type': 'image/png',
      'x-amz-checksum-sha256': Buffer.from(checksumHex, 'hex').toString(
        'base64',
      ),
    });
  });
});
