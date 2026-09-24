import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { S3StorageAdapter } from '../src/modules/storage/s3-storage.adapter';

async function main() {
  const keys = [
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_PUBLIC_BASE_URL',
  ];
  const config = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  ) as Record<string, string>;
  for (const key of keys) assert(config[key], `${key} is required`);
  const storage = new S3StorageAdapter(new ConfigService(config));
  const bytes = await sharp({
    create: { width: 300, height: 300, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  const key = `smoke/${randomUUID()}.png`;
  const client = new S3Client({
    region: config.S3_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
  try {
    const signed = await storage.signUpload(
      key,
      'image/png',
      bytes.length,
      createHash('sha256').update(bytes).digest('hex'),
    );
    const oversized = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(Buffer.concat([bytes, Buffer.from([0])])),
    });
    assert(!oversized.ok, 'Signed PUT accepted a different size');

    const mistyped = await fetch(signed.url, {
      method: 'PUT',
      headers: { ...signed.headers, 'Content-Type': 'text/plain' },
      body: new Uint8Array(bytes),
    });
    assert(!mistyped.ok, 'Signed PUT accepted a different type');

    const changed = Buffer.from(bytes);
    changed[0] ^= 1;
    const tampered = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(changed),
    });
    assert(!tampered.ok, 'Signed PUT accepted a different checksum');

    const upload = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(bytes),
    });
    assert(upload.ok, `Signed PUT failed: ${upload.status}`);
    const replay = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(changed),
    });
    assert(!replay.ok, 'Signed PUT allowed a changed object after upload');
    assert.deepEqual(await storage.load(key, 5 * 1024 * 1024), bytes);
    const publicResponse = await fetch(storage.publicUrl(key));
    assert(publicResponse.ok, `Public GET failed: ${publicResponse.status}`);
    assert.deepEqual(Buffer.from(await publicResponse.arrayBuffer()), bytes);
    console.info(
      'Signed PUT enforces size and checksum; verified read and public GET passed',
    );
  } finally {
    await client.send(
      new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
    );
    client.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
