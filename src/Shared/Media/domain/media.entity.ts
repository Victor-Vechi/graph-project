export type MediaVisibility = 'PUBLIC' | 'PRIVATE';

export type MediaKind =
    | 'IMAGE'
    | 'PDF'
    | 'DOCUMENT'
    | 'PRESENTATION'
    | 'ARCHIVE'
    | 'DATASET'
    | 'OTHER';

export interface Base64FileObjectInput {
    base64?: string;
    data?: string;
    content?: string;
    fileName?: string;
    originalName?: string;
    name?: string;
    mimeType?: string;
    mimetype?: string;
    type?: string;
}

export interface BufferFileInput {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

export type Base64FileInput = string | Base64FileObjectInput | BufferFileInput;

export interface MediaFileFallbackMeta {
    fileName?: string;
    mimeType?: string;
}

export interface ParsedMediaFile {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
    base64Data: string;
}

export interface MediaAssetEntity {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    checksum: string | null;
    base64Data?: string;
    kind: MediaKind;
    visibility: MediaVisibility;
    uploadedById: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface MediaAssetResponse {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    kind: MediaKind;
    visibility: MediaVisibility;
    url?: string;
    alt?: string;
}
