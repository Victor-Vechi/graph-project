import { Injectable, Logger, Optional } from '@nestjs/common';
import { PostRepository } from '../infra/post.repository';
import { PostAdapted, PostEntity, PostTagItem } from '../domain/post.entity';
import { hasVisibleText, sanitizeRichText } from '../../Shared/Sanitizer/application/html-sanitizer';
import { MediaService } from '../../Shared/Media/application/media.service';

export interface PostInput {
    title?: string;
    content?: string;
    tags?: unknown;
    cover?: unknown;
    coverBase64?: unknown;
    coverName?: string;
    coverMimeType?: string;
    coverAlt?: string;
    removeCover?: boolean | string;
    userId?: number | string;
}

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);

    constructor(
        private readonly postRepository: PostRepository,
        @Optional() private readonly mediaService?: MediaService,
    ) {}

    async create(data: PostInput, userId?: number): Promise<PostAdapted | null> {
        const title = data.title?.trim();
        const content = sanitizeRichText(data.content);
        const tags = this.normalizeTags(data.tags);

        if (!title || !hasVisibleText(content) || !tags.length) return null;
        if (await this.postRepository.findExactTitle(title)) return null;

        const authorId = userId ?? (data.userId ? Number(data.userId) : null);
        const coverInput = data.cover ?? data.coverBase64;
        const uploaded =
            coverInput && this.mediaService
                ? await this.mediaService.uploadPublicImage(coverInput, authorId, {
                      fileName: data.coverName,
                      mimeType: data.coverMimeType,
                  })
                : null;

        try {
            const post = await this.postRepository.create({
                title,
                content,
                tags,
                userId: authorId,
                coverMediaId: uploaded?.id ?? null,
                coverAlt: uploaded ? data.coverAlt?.trim() || title : null,
                createdAt: new Date(),
                updatedAt: new Date(),
                active: true,
            });

            return this.toAdapted(post);
        } catch (error) {
            if (uploaded && this.mediaService) {
                await this.mediaService.deleteAsset(uploaded.id).catch(() => undefined);
            }
            throw error;
        }
    }

    async update(id: number, data: PostInput, userId?: number): Promise<PostAdapted | null> {
        const title = data.title?.trim();
        const content = sanitizeRichText(data.content);
        const tags = this.normalizeTags(data.tags);

        if (!id || !title || !hasVisibleText(content) || !tags.length) return null;

        const current = await this.postRepository.findById(id);
        if (!current) return null;

        const removeCover = this.toBoolean(data.removeCover);
        const coverInput = data.cover ?? data.coverBase64;
        const authorId = userId ?? (data.userId ? Number(data.userId) : null);
        const uploaded =
            coverInput && this.mediaService
                ? await this.mediaService.uploadPublicImage(coverInput, authorId, {
                      fileName: data.coverName,
                      mimeType: data.coverMimeType,
                  })
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

            if (current.coverMediaId && (uploaded || removeCover) && this.mediaService) {
                await this.mediaService.deleteAsset(current.coverMediaId).catch(error => {
                    this.logger.warn(`Post ${id} updated but old cover cleanup failed: ${String(error)}`);
                });
            }

            return this.toAdapted(post);
        } catch (error) {
            if (uploaded && this.mediaService) {
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

        if (post.coverMediaId && this.mediaService) {
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

        return posts ? posts.map(p => this.toAdapted(p)) : null;
    }

    async findAll(): Promise<PostAdapted[]> {
        const posts = await this.postRepository.findAll();
        return posts.map(p => this.toAdapted(p));
    }

    private toAdapted(post: PostEntity): PostAdapted {
        const tags: PostTagItem[] = (post.tags ?? []).map((pt: unknown) => {
            if (typeof pt === 'object' && pt !== null) {
                const entry = pt as { tag?: { id: number; name: string }; id?: number; name?: string };
                if (entry.tag) return { id: entry.tag.id, name: entry.tag.name };
                if (entry.id !== undefined) return { id: Number(entry.id), name: String(entry.name ?? '') };
            }
            return { id: Number(pt), name: '' };
        });

        return {
            id: post.id.toString(),
            title: post.title,
            content: post.content,
            tags,
            createdAt: post.createdAt,
            author: post.user
                ? { id: post.user.id.toString(), name: post.user.name }
                : null,
            cover:
                post.coverMedia && this.mediaService
                    ? this.mediaService.toResponse(post.coverMedia, post.coverAlt ?? post.title)
                    : null,
        };
    }

    private normalizeTags(value: unknown): number[] {
        let raw: unknown[] = [];

        if (Array.isArray(value)) {
            raw = value;
        } else if (typeof value === 'string') {
            try {
                const parsed: unknown = JSON.parse(value);
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
