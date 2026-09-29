import { MediaAssetEntity, MediaAssetResponse } from '../../Shared/Media/domain/media.entity';

export interface MaterialEntity {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    year: number | null;
    tags: string[];
    mediaId: string;
    uploadedById: number | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    media?: MediaAssetEntity;
    uploadedBy?: { id: number; name: string } | null;
}

export interface MaterialAdapted {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    year: number | null;
    tags: string[];
    createdAt: Date;
    uploadedBy: { id: string; name: string } | null;
    media: MediaAssetResponse;
}
