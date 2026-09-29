import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../../Shared/Media/application/media.service';
import { UploadedMediaFile } from '../../Shared/Media/domain/media.entity';
import { MaterialAdapted, MaterialEntity } from '../domain/material.entity';
import { MaterialRepository } from '../infra/material.repository';

interface MaterialInput {
    title?: string;
    description?: string;
    category?: string;
    year?: number | string;
    tags?: unknown;
}

@Injectable()
export class MaterialService {
    private readonly logger = new Logger(MaterialService.name);

    constructor(
        private readonly materialRepository: MaterialRepository,
        private readonly mediaService: MediaService,
    ) {}

    async create(
        data: MaterialInput,
        uploaderId: number,
        file?: UploadedMediaFile,
    ): Promise<MaterialAdapted | null> {
        const title = data.title?.trim();
        if (!title || !uploaderId || !file) return null;

        const uploaded = await this.mediaService.uploadPrivateMaterial(file, uploaderId);

        try {
            const material = await this.materialRepository.create({
                title,
                description: data.description?.trim() || null,
                category: data.category?.trim() || null,
                year: this.parseYear(data.year),
                tags: this.normalizeTags(data.tags),
                mediaId: uploaded.id,
                uploadedById: uploaderId,
                active: true,
            });

            return this.toAdapted(material);
        } catch (error) {
            await this.mediaService.deleteAsset(uploaded.id).catch(() => undefined);
            throw error;
        }
    }

    async update(
        id: number,
        data: MaterialInput,
        uploaderId: number,
        file?: UploadedMediaFile,
    ): Promise<MaterialAdapted | null> {
        const current = await this.materialRepository.findById(id);
        if (!current) return null;

        const uploaded = file
            ? await this.mediaService.uploadPrivateMaterial(file, uploaderId)
            : null;

        try {
            const material = await this.materialRepository.update(id, {
                ...(data.title !== undefined ? { title: data.title.trim() } : {}),
                ...(data.description !== undefined
                    ? { description: data.description.trim() || null }
                    : {}),
                ...(data.category !== undefined
                    ? { category: data.category.trim() || null }
                    : {}),
                ...(data.year !== undefined ? { year: this.parseYear(data.year) } : {}),
                ...(data.tags !== undefined ? { tags: this.normalizeTags(data.tags) } : {}),
                ...(uploaded ? { mediaId: uploaded.id } : {}),
            });

            if (uploaded) {
                await this.mediaService.deleteAsset(current.mediaId).catch(error => {
                    this.logger.warn(`Material ${id} updated but old media cleanup failed: ${String(error)}`);
                });
            }

            return this.toAdapted(material);
        } catch (error) {
            if (uploaded) {
                await this.mediaService.deleteAsset(uploaded.id).catch(() => undefined);
            }
            throw error;
        }
    }

    async delete(id: number): Promise<boolean> {
        const material = await this.materialRepository.findById(id);
        if (!material) return false;

        await this.materialRepository.delete(id);
        await this.mediaService.deleteAsset(material.mediaId).catch(error => {
            this.logger.warn(`Material ${id} deleted but media cleanup failed: ${String(error)}`);
        });
        return true;
    }

    async findAll(): Promise<MaterialAdapted[]> {
        const materials = await this.materialRepository.findAll();
        return materials.map(material => this.toAdapted(material));
    }

    async findById(id: number): Promise<MaterialAdapted | null> {
        const material = await this.materialRepository.findById(id);
        return material ? this.toAdapted(material) : null;
    }

    async getDownloadUrl(id: number): Promise<{ url: string; expiresIn: number } | null> {
        const material = await this.materialRepository.findById(id);
        if (!material) return null;
        return this.mediaService.getDownloadUrl(material.mediaId);
    }

    private toAdapted(material: MaterialEntity): MaterialAdapted {
        if (!material.media) {
            throw new Error(`Material ${material.id} has no media relation`);
        }

        return {
            id: material.id.toString(),
            title: material.title,
            description: material.description,
            category: material.category,
            year: material.year,
            tags: material.tags ?? [],
            createdAt: material.createdAt,
            uploadedBy: material.uploadedBy
                ? { id: material.uploadedBy.id.toString(), name: material.uploadedBy.name }
                : null,
            media: this.mediaService.toResponse(material.media),
        };
    }

    private parseYear(value: string | number | undefined): number | null {
        if (value === undefined || value === null || value === '') return null;

        const year = Number(value);
        if (!Number.isInteger(year) || year < 1900 || year > 2100) {
            throw new BadRequestException('Invalid material year');
        }
        return year;
    }

    private normalizeTags(value: unknown): string[] {
        let raw: unknown[] = [];

        if (Array.isArray(value)) {
            raw = value;
        } else if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                raw = Array.isArray(parsed) ? parsed : value.split(',');
            } catch {
                raw = value.split(',');
            }
        }

        return [...new Set(
            raw.map(item => String(item).trim()).filter(Boolean),
        )];
    }
}
