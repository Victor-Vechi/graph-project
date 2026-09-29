import { Injectable } from '@nestjs/common';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    PutStorageObjectInput,
    PutStorageObjectResult,
    StoragePort,
} from '../domain/storage.interface';

@Injectable()
export class S3StorageService implements StoragePort {
    private readonly client: S3Client;
    private readonly region: string;
    private readonly endpoint?: string;
    private readonly forcePathStyle: boolean;

    constructor() {
        this.region = process.env.S3_REGION ?? 'us-east-1';
        this.endpoint = process.env.S3_ENDPOINT || undefined;
        this.forcePathStyle = this.toBoolean(process.env.S3_FORCE_PATH_STYLE, !!this.endpoint);

        const accessKeyId = process.env.S3_ACCESS_KEY;
        const secretAccessKey = process.env.S3_SECRET_KEY;

        this.client = new S3Client({
            region: this.region,
            endpoint: this.endpoint,
            forcePathStyle: this.forcePathStyle,
            credentials:
                accessKeyId && secretAccessKey
                    ? { accessKeyId, secretAccessKey }
                    : undefined,
        });
    }

    async putObject(input: PutStorageObjectInput): Promise<PutStorageObjectResult> {
        const response = await this.client.send(
            new PutObjectCommand({
                Bucket: input.bucket,
                Key: input.key,
                Body: input.body,
                ContentType: input.contentType,
                CacheControl: input.cacheControl,
            }),
        );

        return { etag: response.ETag?.replace(/"/g, '') };
    }

    async deleteObject(bucket: string, key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }

    getPublicUrl(bucket: string, key: string): string {
        const encodedKey = key.split('/').map(encodeURIComponent).join('/');
        const configuredPublicEndpoint = process.env.S3_PUBLIC_ENDPOINT?.replace(/\/$/, '');

        if (configuredPublicEndpoint) {
            return `${configuredPublicEndpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;
        }

        if (this.endpoint) {
            return `${this.endpoint.replace(/\/$/, '')}/${encodeURIComponent(bucket)}/${encodedKey}`;
        }

        if (this.region === 'us-east-1') {
            return `https://${encodeURIComponent(bucket)}.s3.amazonaws.com/${encodedKey}`;
        }

        return `https://${encodeURIComponent(bucket)}.s3.${this.region}.amazonaws.com/${encodedKey}`;
    }

    async getSignedReadUrl(
        bucket: string,
        key: string,
        expiresInSeconds = this.defaultPresignTtl(),
    ): Promise<string> {
        return getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: bucket, Key: key }),
            { expiresIn: expiresInSeconds },
        );
    }

    private defaultPresignTtl(): number {
        const configured = Number(process.env.S3_PRESIGN_TTL_SECONDS ?? 900);
        return Number.isFinite(configured) && configured > 0 ? configured : 900;
    }

    private toBoolean(value: string | undefined, fallback: boolean): boolean {
        if (value === undefined) return fallback;
        return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }
}
