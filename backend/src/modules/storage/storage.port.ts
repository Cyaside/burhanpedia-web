export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  signUpload(
    key: string,
    contentType: string,
  ): Promise<{ url: string; headers: Record<string, string> }>;
  load(key: string, maximumBytes: number): Promise<Buffer>;
  publicUrl(key: string): string;
}
