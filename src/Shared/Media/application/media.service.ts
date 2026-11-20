import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
    Base64FileObjectInput,
    BufferFileInput,
    MediaAssetEntity,
    MediaAssetResponse,
    MediaFileFallbackMeta,
    MediaKind,
    MediaVisibility,
    ParsedMediaFile,
} from '../domain/media.entity';
import { MediaRepository } from '../infra/media.repository';

interface UploadOptions {
    visibility: MediaVisibility;
    uploaderId: number | null;
    maxBytes: number;
    allowedKinds: MediaKind[];
    fallbackMeta?: MediaFileFallbackMeta;
}

const DATA_URI_REGEX = /^data:([^;,]+)?(?:;[^;,]+)*;base64,([\s\S]+)$/i;
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

const MIME_ALIASES: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'application/x-zip-compressed': 'application/zip',
};

const MIME_KIND_MAP: Record<string, MediaKind> = {
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/webp': 'IMAGE',
    'image/gif': 'IMAGE',
    'application/pdf': 'PDF',
    'application/msword': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
    'application/vnd.ms-excel': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENT',
    'text/plain': 'DOCUMENT',
    'application/vnd.ms-powerpoint': 'PRESENTATION',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PRESENTATION',
    'application/zip': 'ARCHIVE',
    'text/csv': 'DATASET',
    'application/json': 'DATASET',
};

const MIME_EXTENSIONS: Record<string, string> = {
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

const EXTENSION_MIMES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
};

@Injectable()
export class MediaService {
    constructor(private readonly mediaRepository: MediaRepository) {}

    uploadPublicImage(
        input: unknown,
        uploaderId: number | null,
        fallbackMeta?: MediaFileFallbackMeta,
    ): Promise<MediaAssetEntity> {
        return this.upload(input, {
            visibility: 'PUBLIC',
            uploaderId,
            maxBytes: this.numberEnv('MAX_IMAGE_UPLOAD_BYTES', 10 * 1024 * 1024),
            allowedKinds: ['IMAGE'],
            fallbackMeta,
        });
    }

    uploadPrivateMaterial(
        input: unknown,
        uploaderId: number | null,
        fallbackMeta?: MediaFileFallbackMeta,
    ): Promise<MediaAssetEntity> {
        return this.upload(input, {
            visibility: 'PRIVATE',
            uploaderId,
            maxBytes: this.numberEnv('MAX_MATERIAL_UPLOAD_BYTES', 100 * 1024 * 1024),
            allowedKinds: ['IMAGE', 'PDF', 'DOCUMENT', 'PRESENTATION', 'ARCHIVE', 'DATASET'],
            fallbackMeta,
        });
    }

    async deleteAsset(id: string): Promise<void> {
        const asset = await this.mediaRepository.findById(id);
        if (!asset) return;

        await this.mediaRepository.delete(asset.id);
    }

    async getDownloadUrl(
        id: string,
    ): Promise<{ url: string; originalName: string; mimeType: string; expiresIn: number }> {
        const asset = await this.mediaRepository.findById(id);
        if (!asset || !asset.base64Data) throw new NotFoundException('Media not found');

        return {
            url: this.toDataUrl(asset.mimeType, asset.base64Data),
            originalName: asset.originalName,
            mimeType: asset.mimeType,
            expiresIn: 0,
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
                asset.visibility === 'PUBLIC' && asset.base64Data
                    ? this.toDataUrl(asset.mimeType, asset.base64Data)
                    : undefined,
            alt,
        };
    }

    toDataUrl(mimeType: string, base64Data: string): string {
        return `data:${mimeType};base64,${base64Data}`;
    }

    private async upload(input: unknown, options: UploadOptions): Promise<MediaAssetEntity> {
        const parsed = this.parseInput(input, options.fallbackMeta);
        const kind = this.validateParsedFile(parsed, options.allowedKinds, options.maxBytes);
        const checksum = createHash('sha256').update(parsed.buffer).digest('hex');

        return this.mediaRepository.create({
            originalName: parsed.originalName,
            mimeType: parsed.mimeType,
            sizeBytes: BigInt(parsed.sizeBytes),
            checksum,
            base64Data: parsed.base64Data,
            kind,
            visibility: options.visibility,
            uploadedById: options.uploaderId,
        });
    }

    private parseInput(input: unknown, fallbackMeta?: MediaFileFallbackMeta): ParsedMediaFile {
        if (this.isBufferFileInput(input)) {
            const buffer = input.buffer;
            if (!buffer.length) throw new BadRequestException('File is empty');

            const mimeType = this.resolveMimeType(
                input.mimetype || fallbackMeta?.mimeType,
                undefined,
                input.originalname || fallbackMeta?.fileName,
                buffer,
            );
            const originalName = this.sanitizeFileName(
                input.originalname || fallbackMeta?.fileName,
                mimeType,
            );

            return {
                originalName,
                mimeType,
                sizeBytes: buffer.length,
                buffer,
                base64Data: buffer.toString('base64'),
            };
        }

        const { rawBase64, fileName, explicitMime } = this.extractRawInput(input, fallbackMeta);
        const { dataUriMime, payload } = this.splitDataUri(rawBase64);
        const buffer = this.decodeBase64(payload);
        const mimeType = this.resolveMimeType(explicitMime, dataUriMime, fileName, buffer);

        return {
            originalName: this.sanitizeFileName(fileName, mimeType),
            mimeType,
            sizeBytes: buffer.length,
            buffer,
            base64Data: buffer.toString('base64'),
        };
    }

    private isBufferFileInput(input: unknown): input is BufferFileInput {
        return (
            typeof input === 'object' &&
            input !== null &&
            'buffer' in input &&
            Buffer.isBuffer((input as BufferFileInput).buffer)
        );
    }

    private extractRawInput(
        input: unknown,
        fallbackMeta?: MediaFileFallbackMeta,
    ): { rawBase64: string; fileName?: string; explicitMime?: string } {
        if (typeof input === 'string') {
            const trimmed = input.trim();
            if (!trimmed) throw new BadRequestException('Invalid file payload');
            return {
                rawBase64: trimmed,
                fileName: fallbackMeta?.fileName,
                explicitMime: fallbackMeta?.mimeType,
            };
        }

        if (typeof input === 'object' && input !== null) {
            const obj = input as Base64FileObjectInput;
            const rawBase64 = [obj.base64, obj.data, obj.content].find(
                (v): v is string => typeof v === 'string' && v.trim().length > 0,
            );
            if (!rawBase64) throw new BadRequestException('Invalid file payload');

            return {
                rawBase64: rawBase64.trim(),
                fileName: obj.fileName ?? obj.originalName ?? obj.name ?? fallbackMeta?.fileName,
                explicitMime: obj.mimeType ?? obj.mimetype ?? obj.type ?? fallbackMeta?.mimeType,
            };
        }

        throw new BadRequestException('Invalid file payload');
    }

    private splitDataUri(raw: string): { dataUriMime?: string; payload: string } {
        if (!raw.toLowerCase().startsWith('data:')) {
            return { payload: raw };
        }

        const match = DATA_URI_REGEX.exec(raw);
        if (!match) {
            throw new BadRequestException('Invalid base64 data URI');
        }

        return {
            dataUriMime: match[1]?.trim(),
            payload: match[2],
        };
    }

    private decodeBase64(payload: string): Buffer {
        const compact = payload.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        if (!compact || compact.length % 4 === 1 || !BASE64_REGEX.test(compact)) {
            throw new BadRequestException('Invalid base64 file content');
        }

        const remainder = compact.length % 4;
        const padded = remainder === 0 ? compact : compact.padEnd(compact.length + (4 - remainder), '=');
        const buffer = Buffer.from(padded, 'base64');

        if (!buffer.length) {
            throw new BadRequestException('File is empty');
        }

        return buffer;
    }

    private resolveMimeType(
        explicitMime: string | undefined,
        dataUriMime: string | undefined,
        fileName: string | undefined,
        buffer: Buffer,
    ): string {
        const normalizedExplicit = this.normalizeMimeType(explicitMime);
        const normalizedDataUri = this.normalizeMimeType(dataUriMime);

        const preferred =
            normalizedDataUri && normalizedDataUri !== 'application/octet-stream'
                ? normalizedDataUri
                : normalizedExplicit && normalizedExplicit !== 'application/octet-stream'
                    ? normalizedExplicit
                    : undefined;

        if (preferred) return preferred;

        const inferred = this.detectMimeFromBuffer(buffer, fileName) ?? this.mimeFromFileName(fileName);
        if (!inferred) {
            throw new BadRequestException('Could not determine file MIME type');
        }
        return inferred;
    }

    private normalizeMimeType(mime?: string): string {
        if (!mime) return '';
        const base = mime.split(';')[0].trim().toLowerCase();
        return MIME_ALIASES[base] ?? base;
    }

    private mimeFromFileName(fileName?: string): string | undefined {
        if (!fileName) return undefined;
        const ext = fileName.split('.').pop()?.trim().toLowerCase();
        return ext ? EXTENSION_MIMES[ext] : undefined;
    }

    private detectMimeFromBuffer(buffer: Buffer, fileName?: string): string | undefined {
        if (this.startsWith(buffer, 0xff, 0xd8, 0xff)) return 'image/jpeg';
        if (this.startsWith(buffer, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
        if (this.ascii(buffer, 0, 4) === 'RIFF' && this.ascii(buffer, 8, 12) === 'WEBP') return 'image/webp';
        if (this.ascii(buffer, 0, 6) === 'GIF87a' || this.ascii(buffer, 0, 6) === 'GIF89a') return 'image/gif';
        if (this.ascii(buffer, 0, 5) === '%PDF-') return 'application/pdf';

        if (this.isZip(buffer)) {
            const byName = this.mimeFromFileName(fileName);
            if (
                byName === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                byName === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                byName === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ) {
                return byName;
            }
            return 'application/zip';
        }

        return undefined;
    }

    private sanitizeFileName(fileName: string | undefined, mimeType: string): string {
        const cleaned = (fileName ?? '').replace(/^.*[\\/]/, '').trim();
        if (cleaned) return cleaned;
        return `upload.${this.extensionFor(mimeType)}`;
    }

    private validateParsedFile(
        file: ParsedMediaFile,
        allowedKinds: MediaKind[],
        maxBytes: number,
    ): MediaKind {
        if (file.sizeBytes <= 0) {
            throw new BadRequestException('File is empty');
        }

        if (file.sizeBytes > maxBytes) {
            throw new BadRequestException(`File exceeds max size of ${maxBytes} bytes`);
        }

        const kind = MIME_KIND_MAP[file.mimeType];
        if (!kind || !allowedKinds.includes(kind)) {
            throw new BadRequestException(`Unsupported file type: ${file.mimeType}`);
        }

        if (!this.hasExpectedSignature(file.mimeType, file.buffer)) {
            throw new BadRequestException('File content does not match MIME type');
        }

        return kind;
    }

    private extensionFor(mimeType: string): string {
        return MIME_EXTENSIONS[mimeType] ?? 'bin';
    }

    private hasExpectedSignature(mimeType: string, buffer: Buffer): boolean {
        switch (mimeType) {
            case 'image/jpeg':
                return this.startsWith(buffer, 0xff, 0xd8, 0xff);
            case 'image/png':
                return this.startsWith(buffer, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
            case 'image/webp':
                return this.ascii(buffer, 0, 4) === 'RIFF' && this.ascii(buffer, 8, 12) === 'WEBP';
            case 'image/gif':
                return this.ascii(buffer, 0, 6) === 'GIF87a' || this.ascii(buffer, 0, 6) === 'GIF89a';
            case 'application/pdf':
                return this.ascii(buffer, 0, 5) === '%PDF-';
            case 'application/zip':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                return this.isZip(buffer);
            default:
                return true;
        }
    }

    private startsWith(buffer: Buffer, ...bytes: number[]): boolean {
        return buffer.length >= bytes.length && bytes.every((value, index) => buffer[index] === value);
    }

    private ascii(buffer: Buffer, start: number, end: number): string {
        return buffer.subarray(start, end).toString('ascii');
    }

    private isZip(buffer: Buffer): boolean {
        return (
            this.startsWith(buffer, 0x50, 0x4b, 0x03, 0x04) ||
            this.startsWith(buffer, 0x50, 0x4b, 0x05, 0x06) ||
            this.startsWith(buffer, 0x50, 0x4b, 0x07, 0x08)
        );
    }

    private numberEnv(name: string, fallback: number): number {
        const value = Number(process.env[name] ?? fallback);
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }
}
