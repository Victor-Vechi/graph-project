import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IPostLogRepository } from '../domain/post-log-repository.interface';
import { PostLogEntity, PostSnapshot } from '../domain/post-log.entity';

@Injectable()
export class PostLogRepository implements IPostLogRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<PostLogEntity, 'id' | 'createdAt'>): Promise<PostLogEntity> {
        return this.prisma.postLog.create({
            data: {
                ...data,
                before: (data.before ?? Prisma.DbNull) as Prisma.InputJsonValue,
                after: (data.after ?? Prisma.DbNull) as Prisma.InputJsonValue,
            },
        });
    }

    findAll(postId?: number): Promise<PostLogEntity[]> {
        return this.prisma.postLog.findMany({
            where: postId ? { postId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPostSnapshot(postId: number): Promise<PostSnapshot | null> {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { tags: { include: { tag: true } } },
        });
        if (!post) return null;

        return {
            title: post.title,
            content: post.content,
            tags: post.tags.map(pt => pt.tag.name).sort(),
        };
    }
}
