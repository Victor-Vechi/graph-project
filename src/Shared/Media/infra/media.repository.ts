import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Database/application/prisma.service';
import { MediaAssetEntity } from '../domain/media.entity';

type CreateMediaData = Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class MediaRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: CreateMediaData): Promise<MediaAssetEntity> {
        return this.prisma.mediaAsset.create({ data }) as Promise<MediaAssetEntity>;
    }

    findById(id: string): Promise<MediaAssetEntity | null> {
        return this.prisma.mediaAsset.findUnique({ where: { id } }) as Promise<MediaAssetEntity | null>;
    }

    delete(id: string): Promise<MediaAssetEntity> {
        return this.prisma.mediaAsset.delete({ where: { id } }) as Promise<MediaAssetEntity>;
    }
}
