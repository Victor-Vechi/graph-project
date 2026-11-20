import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import {
    CreatePostData,
    IPostRepository,
    UpdatePostData,
} from '../domain/post-repository.interface';
import { PostEntity } from '../domain/post.entity';

const INCLUDE_POST_RELATIONS = {
    tags: { include: { tag: true } },
    user: { select: { id: true, name: true } },
    coverMedia: true,
} as const;

@Injectable()
export class PostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreatePostData): Promise<PostEntity> {
        const { tags, ...postData } = data;

        return this.prisma.post.create({
            data: {
                ...postData,
                tags: { create: tags.map(tagId => ({ tagId })) },
            },
            include: INCLUDE_POST_RELATIONS,
        }) as Promise<PostEntity>;
    }

    findById(id: number): Promise<PostEntity | null> {
        return this.prisma.post.findUnique({
            where: { id },
            include: INCLUDE_POST_RELATIONS,
        }) as Promise<PostEntity | null>;
    }

    findExactTitle(title: string): Promise<PostEntity | null> {
        return this.prisma.post.findFirst({
            where: { title },
            include: INCLUDE_POST_RELATIONS,
        }) as Promise<PostEntity | null>;
    }

    findByTitle(title: string): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            where: { title: { contains: title, mode: 'insensitive' } },
            include: INCLUDE_POST_RELATIONS,
        }) as Promise<PostEntity[]>;
    }

    findByTag(tagName: string): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            where: { tags: { some: { tag: { name: tagName } } } },
            include: INCLUDE_POST_RELATIONS,
        }) as Promise<PostEntity[]>;
    }

    findAll(): Promise<PostEntity[]> {
        return this.prisma.post.findMany({
            include: INCLUDE_POST_RELATIONS,
            orderBy: { createdAt: 'desc' },
        }) as Promise<PostEntity[]>;
    }

    update(id: number, data: UpdatePostData): Promise<PostEntity> {
        const { tags, coverMediaId, coverAlt, ...postData } = data;

        return this.prisma.$transaction(async tx => {
            await tx.postTag.deleteMany({ where: { postId: id } });

            return tx.post.update({
                where: { id },
                data: {
                    ...postData,
                    ...(coverMediaId !== undefined ? { coverMediaId } : {}),
                    ...(coverAlt !== undefined ? { coverAlt } : {}),
                    tags: { create: tags.map(tagId => ({ tagId })) },
                },
                include: INCLUDE_POST_RELATIONS,
            }) as Promise<PostEntity>;
        });
    }

    delete(id: number): Promise<PostEntity> {
        return this.prisma.post.delete({
            where: { id },
        }) as Promise<PostEntity>;
    }
}
