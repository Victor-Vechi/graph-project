import { MediaAssetEntity, MediaAssetResponse } from '../../Shared/Media/domain/media.entity';

export interface PostTagItem {
    id: number;
    name: string;
}

export interface PostEntity {
    id: number;
    title: string;
    content: string;
    userId: number | null;
    coverMediaId: string | null;
    coverAlt: string | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    tags?: Array<{ tag: { id: number; name: string } }>;
    user?: { id: number; name: string } | null;
    coverMedia?: MediaAssetEntity | null;
}

export interface PostAdapted {
    id: string;
    title: string;
    content: string;
    tags: PostTagItem[];
    createdAt: Date;
    author: { id: string; name: string } | null;
    cover: MediaAssetResponse | null;
}
