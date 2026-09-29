export type MediaVisibility = 'PUBLIC' | 'PRIVATE';

export type MediaKind =
    | 'IMAGE'
    | 'PDF'
    | 'DOCUMENT'
    | 'PRESENTATION'
    | 'ARCHIVE'
    | 'DATASET'
    | 'OTHER';

export interface UploadedMediaFile {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

export interface MediaAssetEntity {
    id: string;
    bucket: string;
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    checksum: string | null;
    etag: string | null;
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
