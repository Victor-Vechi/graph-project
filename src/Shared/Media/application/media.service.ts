import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { StoragePort } from '../../Storage/domain/storage.interface';
import { STORAGE_PORT } from '../../Storage/storage.tokens';
import {
    MediaAssetEntity,
    MediaAssetResponse,
    MediaKind,
    MediaVisibility,
    UploadedMediaFile,
} from '../domain/media.entity';
import { MediaRepository } from '../infra/media.repository';

interface UploadOptions {
    visibility: MediaVisibility;
    bucket: string;
    prefix: string;
    uploaderId: number;
    maxBytes: number;
    allowedKinds: MediaKind[];
}

@Injectable()
export class MediaService {
    constructor(
        private readonly mediaRepository: MediaRepository,
        @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    ) {}

    uploadPublicImage(
        file: UploadedMediaFile,
        uploaderId: number,
        prefix = 'posts',
    ): Promise<MediaAssetEntity> {
        return this.upload(file, {
            visibility: 'PUBLIC',
            bucket: process.env.S3_PUBLIC_BUCKET ?? 'graph-public-media',
            prefix,
            uploaderId,
            maxBytes: this.numberEnv('MAX_IMAGE_UPLOAD_BYTES', 10 * 1024 * 1024),
            allowedKinds: ['IMAGE'],
        });
    }

    uploadPrivateMaterial(
        file: UploadedMediaFile,
        uploaderId: number,
        prefix = 'materials',
    ): Promise<MediaAssetEntity> {
        return this.upload(file, {
            visibility: 'PRIVATE',
            bucket: process.env.S3_PRIVATE_BUCKET ?? 'graph-private-materials',
            prefix,
            uploaderId,
            maxBytes: this.numberEnv('MAX_MATERIAL_UPLOAD_BYTES', 100 * 1024 * 1024),
            allowedKinds: ['IMAGE', 'PDF', 'DOCUMENT', 'PRESENTATION', 'ARCHIVE', 'DATASET'],
        });
    }

    async deleteAsset(id: string): Promise<void> {
        const asset = await this.mediaRepository.findById(id);
        if (!asset) return;

        await this.storage.deleteObject(asset.bucket, asset.storageKey);
        await this.mediaRepository.delete(asset.id);
    }

    async getDownloadUrl(id: string): Promise<{ url: string; expiresIn: number }> {
        const asset = await this.mediaRepository.findById(id);
        if (!asset) throw new NotFoundException('Media not found');

        if (asset.visibility === 'PUBLIC') {
            return {
                url: this.storage.getPublicUrl(asset.bucket, asset.storageKey),
                expiresIn: 0,
            };
        }

        const expiresIn = this.numberEnv('S3_PRESIGN_TTL_SECONDS', 900);
        return {
            url: await this.storage.getSignedReadUrl(asset.bucket, asset.storageKey, expiresIn),
            expiresIn,
        };
    }

    toResponse(asset: MediaAssetEntity, alt?: string): MediaAssetResponse {
        return {
            id: asset.id,
            originalName: asset.originalName,
            mimeType: asset.mimeType,
            sizeBytes: Number(asset.sizeBytes),
            kind: asset.kind,
            visibility: asset.visibility,
            url:
                asset.visibility === 'PUBLIC'
                    ? this.storage.getPublicUrl(asset.bucket, asset.storageKey)
                    : undefined,
            alt,
        };
    }

    private async upload(
        file: UploadedMediaFile,
        options: UploadOptions,
    ): Promise<MediaAssetEntity> {
        const kind = this.validateFile(file, options.allowedKinds, options.maxBytes);
        const extension = this.extensionFor(file.mimetype);
        const now = new Date();
        const prefix = options.prefix.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '');
        const key = `${prefix}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${extension}`;
        const checksum = createHash('sha256').update(file.buffer).digest('hex');

        const stored = await this.storage.putObject({
            bucket: options.bucket,
            key,
            body: file.buffer,
            contentType: file.mimetype,
            cacheControl:
                options.visibility === 'PUBLIC'
                    ? 'public, max-age=31536000, immutable'
                    : 'private, no-store',
        });

        try {
            return await this.mediaRepository.create({
                bucket: options.bucket,
                storageKey: key,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: BigInt(file.size),
                checksum,
                etag: stored.etag ?? null,
                kind,
                visibility: options.visibility,
                uploadedById: options.uploaderId,
            });
        } catch (error) {
            await this.storage.deleteObject(options.bucket, key).catch(() => undefined);
            throw error;
        }
    }

    private validateFile(
        file: UploadedMediaFile,
        allowedKinds: MediaKind[],
        maxBytes: number,
    ): MediaKind {
        if (!file?.buffer?.length || !file.originalname || !file.mimetype) {
            throw new BadRequestException('Invalid or empty file');
        }

        if (file.size <= 0 || file.size > maxBytes) {
            throw new BadRequestException(`File exceeds the allowed limit of ${maxBytes} bytes`);
        }

        const kind = this.kindFor(file.mimetype);
        if (!kind || !allowedKinds.includes(kind)) {
            throw new BadRequestException(`Unsupported media type: ${file.mimetype}`);
        }

        if (!this.hasExpectedSignature(file)) {
            throw new BadRequestException('File signature does not match its declared media type');
        }

        return kind;
    }

    private kindFor(mimeType: string): MediaKind | null {
        if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) return 'IMAGE';
        if (mimeType === 'application/pdf') return 'PDF';
        if (
            [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
            ].includes(mimeType)
        ) return 'DOCUMENT';
        if (
            [
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ].includes(mimeType)
        ) return 'PRESENTATION';
        if (mimeType === 'application/zip') return 'ARCHIVE';
        if (['text/csv', 'application/json'].includes(mimeType)) return 'DATASET';
        return null;
    }

    private extensionFor(mimeType: string): string {
        const extensions: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'application/zip': 'zip',
            'text/plain': 'txt',
            'text/csv': 'csv',
            'application/json': 'json',
        };

        return extensions[mimeType] ?? 'bin';
    }

    private hasExpectedSignature(file: UploadedMediaFile): boolean {
        const b = file.buffer;
        const starts = (...bytes: number[]) => bytes.every((value, index) => b[index] === value);
        const ascii = (start: number, end: number) => b.subarray(start, end).toString('ascii');

        switch (file.mimetype) {
            case 'image/jpeg':
                return starts(0xff, 0xd8, 0xff);
            case 'image/png':
                return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
            case 'image/webp':
                return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
            case 'image/gif':
                return ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a';
            case 'application/pdf':
                return ascii(0, 5) === '%PDF-';
            case 'application/zip':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                return this.isZip(b);
            default:
                return true;
        }
    }

    private isZip(buffer: Buffer): boolean {
        return (
            (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) ||
            (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x05 && buffer[3] === 0x06) ||
            (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x07 && buffer[3] === 0x08)
        );
    }

    private numberEnv(name: string, fallback: number): number {
        const value = Number(process.env[name] ?? fallback);
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }
}
