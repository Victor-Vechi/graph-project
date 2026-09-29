import { Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../../Shared/Media/application/media.service';
import { UploadedMediaFile } from '../../Shared/Media/domain/media.entity';
import { PostAdapted, PostEntity } from '../domain/post.entity';
import { PostRepository } from '../infra/post.repository';

interface PostInput {
    title?: string;
    content?: string;
    tags?: unknown;
    coverAlt?: string;
    removeCover?: boolean | string;
}

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);

    constructor(
        private readonly postRepository: PostRepository,
        private readonly mediaService: MediaService,
    ) {}

    async create(
        data: PostInput,
        userId: number,
        coverFile?: UploadedMediaFile,
    ): Promise<PostAdapted | null> {
        const tags = this.normalizeTags(data.tags);
        const title = data.title?.trim();
        const content = data.content?.trim();

        if (!title || !content || !tags.length || !userId) return null;
        if (await this.postRepository.findExactTitle(title)) return null;

        const uploaded = coverFile
            ? await this.mediaService.uploadPublicImage(coverFile, userId, 'posts/covers')
            : null;

        try {
            const post = await this.postRepository.create({
                title,
                content,
                tags,
                userId,
                coverMediaId: uploaded?.id ?? null,
                coverAlt: uploaded ? data.coverAlt?.trim() || title : null,
                createdAt: new Date(),
                updatedAt: new Date(),
                active: true,
            });

            return this.toAdapted(post);
        } catch (error) {
            if (uploaded) {
                await this.mediaService.deleteAsset(uploaded.id).catch(() => undefined);
            }
            throw error;
        }
    }

    async update(
        id: number,
        data: PostInput,
        userId: number,
        coverFile?: UploadedMediaFile,
    ): Promise<PostAdapted | null> {
        const tags = this.normalizeTags(data.tags);
        const title = data.title?.trim();
        const content = data.content?.trim();

        if (!id || !title || !content || !tags.length) return null;

        const current = await this.postRepository.findById(id);
        if (!current) return null;

        const removeCover = this.toBoolean(data.removeCover);
        const uploaded = coverFile
            ? await this.mediaService.uploadPublicImage(coverFile, userId, 'posts/covers')
            : null;

        try {
            const post = await this.postRepository.update(id, {
                title,
                content,
                tags,
                coverMediaId: uploaded ? uploaded.id : removeCover ? null : undefined,
                coverAlt: uploaded
                    ? data.coverAlt?.trim() || title
                    : removeCover
                        ? null
                        : data.coverAlt !== undefined
                            ? data.coverAlt.trim() || title
                            : undefined,
                updatedAt: new Date(),
            });

            if (current.coverMediaId && (uploaded || removeCover)) {
                await this.mediaService.deleteAsset(current.coverMediaId).catch(error => {
                    this.logger.warn(`Post ${id} updated but old cover cleanup failed: ${String(error)}`);
                });
            }

            return this.toAdapted(post);
        } catch (error) {
            if (uploaded) {
                await this.mediaService.deleteAsset(uploaded.id).catch(() => undefined);
            }
            throw error;
        }
    }

    async delete(id: number): Promise<boolean> {
        if (!id) return false;

        const post = await this.postRepository.findById(id);
        if (!post) return false;

        await this.postRepository.delete(id);

        if (post.coverMediaId) {
            await this.mediaService.deleteAsset(post.coverMediaId).catch(error => {
                this.logger.warn(`Post ${id} deleted but cover cleanup failed: ${String(error)}`);
            });
        }

        return true;
    }

    async search(data: { title?: string; tag?: string }): Promise<PostAdapted[] | null> {
        if (!data.title && !data.tag) return null;

        const posts = data.title
            ? await this.postRepository.findByTitle(data.title)
            : await this.postRepository.findByTag(data.tag!);

        return posts ? posts.map(post => this.toAdapted(post)) : null;
    }

    async findAll(): Promise<PostAdapted[]> {
        const posts = await this.postRepository.findAll();
        return posts.map(post => this.toAdapted(post));
    }

    private toAdapted(post: PostEntity): PostAdapted {
        return {
            id: post.id.toString(),
            title: post.title,
            content: post.content,
            tags: (post.tags ?? []).map(pt => ({ id: pt.tag.id, name: pt.tag.name })),
            createdAt: post.createdAt,
            author: post.user
                ? { id: post.user.id.toString(), name: post.user.name }
                : null,
            cover: post.coverMedia
                ? this.mediaService.toResponse(
                    post.coverMedia,
                    post.coverAlt ?? post.title,
                )
                : null,
        };
    }

    private normalizeTags(value: unknown): number[] {
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

        return [...new Set(raw.map(Number).filter(id => Number.isInteger(id) && id > 0))];
    }

    private toBoolean(value: boolean | string | undefined): boolean {
        if (typeof value === 'boolean') return value;
        if (!value) return false;
        return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }
}
