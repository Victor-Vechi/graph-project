import { Injectable, Logger } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaAssetEntity, MediaAssetResponse } from '../domain/media.entity';

export interface PhotoInput {
    photo?: unknown;
    removePhoto?: boolean;
}

@Injectable()
export class PhotoService {
    private readonly logger = new Logger(PhotoService.name);

    constructor(private readonly mediaService: MediaService) {}

    async save<T>(
        input: PhotoInput,
        currentId: string | null | undefined,
        uploadedById: number | null,
        persist: (photoMediaId: string | null | undefined) => Promise<T>,
    ): Promise<T> {
        const uploaded = input.photo
            ? await this.mediaService.uploadPublicImage(input.photo, uploadedById)
            : null;
        const nextId = uploaded?.id ?? (input.removePhoto === true ? null : undefined);
        let result: T;
        try {
            result = await persist(nextId);
        } catch (error) {
            if (uploaded) await this.cleanup(uploaded.id);
            throw error;
        }
        if (currentId && nextId !== undefined && currentId !== nextId) {
            await this.cleanup(currentId);
        }
        return result;
    }

    toResponse(asset: MediaAssetEntity | null | undefined, name: string): MediaAssetResponse | null {
        return asset ? this.mediaService.toResponse(asset, name) : null;
    }

    async cleanup(id: string | null | undefined): Promise<void> {
        if (!id) return;
        await this.mediaService.deleteAsset(id).catch(error => {
            this.logger.warn(`Unable to remove photo ${id}: ${String(error)}`);
        });
    }
}
