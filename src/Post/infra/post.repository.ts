import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IPostRepository } from '../domain/post-repository.interface';
import { PostEntity } from '../domain/post.entity';

const INCLUDE_TAGS = { tags: { include: { tag: true } } } as const;

@Injectable()
export class PostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: {
        title: string;
        content: string;
        tags: number[];
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
    }): Promise<PostEntity> {
        const { tags, ...postData } = data;
        return this.prisma.post.create({
            data: {
                ...postData,
                tags: { create: tags.map(tagId => ({ tagId })) },
            },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity>;
    }

    findById(id: number): Promise<PostEntity | null> {
        return this.prisma.post.findUnique({
            where: { id },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity | null>;
    }

    findExactTitle(title: string): Promise<PostEntity | null> {
        return this.prisma.post.findFirst({
            where: { title },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity | null>;
    }

    findByTitle(title: string): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            where: { title: { contains: title, mode: 'insensitive' } },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity[]>;
    }

    findByTag(tagName: string): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            where: { tags: { some: { tag: { name: tagName } } } },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity[]>;
    }

    findAll(): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity[]>;
    }

    async update(
        id: number,
        data: { title: string; content: string; tags: number[]; updatedAt: Date },
    ): Promise<PostEntity> {
        const { tags, ...postData } = data;
        await this.prisma.postTag.deleteMany({ where: { postId: id } });
        return this.prisma.post.update({
            where: { id },
            data: {
                ...postData,
                tags: { create: tags.map(tagId => ({ tagId })) },
            },
            include: INCLUDE_TAGS,
        }) as Promise<PostEntity>;
    }

    delete(id: number): Promise<PostEntity> {
        return this.prisma.post.delete({
            where: { id },
        }) as Promise<PostEntity>;
    }
}
