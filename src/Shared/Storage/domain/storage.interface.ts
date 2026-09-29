export interface PutStorageObjectInput {
    bucket: string;
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
}

export interface PutStorageObjectResult {
    etag?: string;
}

export interface StoragePort {
    putObject(input: PutStorageObjectInput): Promise<PutStorageObjectResult>;
    deleteObject(bucket: string, key: string): Promise<void>;
    getPublicUrl(bucket: string, key: string): string;
    getSignedReadUrl(bucket: string, key: string, expiresInSeconds?: number): Promise<string>;
}
