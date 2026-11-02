import { Injectable } from '@nestjs/common';
import { PostRepository } from '../infra/post.repository';
import { PostAdapted, PostEntity } from '../domain/post.entity';
import { hasVisibleText, sanitizeRichText } from '../../Shared/Sanitizer/application/html-sanitizer';

@Injectable()
export class PostService {
    constructor(private readonly postRepository: PostRepository) {}

    async create(data: { title: string; content: string; tags: number[] }): Promise<PostEntity | null> {
        const content = sanitizeRichText(data.content);
        if (!data.title || !hasVisibleText(content) || !data.tags?.length) return null;
        if (await this.postRepository.findExactTitle(data.title)) return null;

        return this.postRepository.create({
            title: data.title,
            content,
            tags: data.tags,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
        });
    }

    async update(id: number, data: { title: string; content: string; tags: number[] }): Promise<PostEntity | null> {
        const content = sanitizeRichText(data.content);
        if (!id || !data.title || !hasVisibleText(content) || !data.tags?.length) return null;
        if (!await this.postRepository.findById(id)) return null;

        return this.postRepository.update(id, {
            title: data.title,
            content,
            tags: data.tags,
            updatedAt: new Date(),
        });
    }

    async delete(id: number): Promise<boolean> {
        if (!id || !await this.postRepository.findById(id)) return false;
        await this.postRepository.delete(id);
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
        return {
            id: post.id.toString(),
            title: post.title,
            content: post.content,
            tags: (post.tags ?? []).map(pt => ({ id: pt.tag.id, name: pt.tag.name })),
            createdAt: post.createdAt,
        };
    }
}
