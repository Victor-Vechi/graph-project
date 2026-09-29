import { Injectable, Logger } from '@nestjs/common';
import { PostLogRepository } from '../infra/post-log.repository';
import type { JwtPayload } from '../../Shared/Auth/domain/jwt.interface';
import {
    PostLogAction,
    PostLogAdapted,
    PostLogEntity,
    PostLogField,
    PostSnapshot,
} from '../domain/post-log.entity';

const FIELDS: PostLogField[] = ['title', 'content', 'tags'];

@Injectable()
export class PostLogService {
    private readonly logger = new Logger(PostLogService.name);

    constructor(private readonly postLogRepository: PostLogRepository) {}

    snapshot(postId: number): Promise<PostSnapshot | null> {
        if (!postId) return Promise.resolve(null);
        return this.postLogRepository.findPostSnapshot(postId);
    }

    // A operação na notícia já foi concluída quando o log é gravado: uma falha aqui
    // é registrada no console do servidor, mas não transforma o sucesso em erro para o usuário.
    async register(data: {
        action: PostLogAction;
        postId: number;
        user: JwtPayload;
        before: PostSnapshot | null;
        after: PostSnapshot | null;
    }): Promise<void> {
        try {
            const changes = this.changedFields(data.before, data.after);
            if (data.action === 'UPDATE' && !changes.length) return;

            await this.postLogRepository.create({
                action: data.action,
                postId: data.action === 'DELETE' ? null : data.postId,
                userId: parseInt(data.user.id) || null,
                userName: data.user.name || data.user.email,
                postTitle: data.after?.title ?? data.before?.title ?? '',
                changes,
                before: data.before,
                after: data.after,
            });
        } catch (error) {
            this.logger.error(`Failed to register ${data.action} log for post ${data.postId}`, error);
        }
    }

    async findAll(postId?: number): Promise<PostLogAdapted[]> {
        const logs = await this.postLogRepository.findAll(postId || undefined);
        return logs.map(l => this.toAdapted(l));
    }

    private changedFields(before: PostSnapshot | null, after: PostSnapshot | null): PostLogField[] {
        if (!before || !after) return FIELDS;
        return FIELDS.filter(field => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
    }

    private toAdapted(log: PostLogEntity): PostLogAdapted {
        return {
            id: log.id.toString(),
            postId: log.postId?.toString() ?? null,
            postTitle: log.postTitle,
            userId: log.userId?.toString() ?? null,
            userName: log.userName,
            action: log.action as PostLogAction,
            changes: log.changes as PostLogField[],
            before: (log.before as PostSnapshot) ?? null,
            after: (log.after as PostSnapshot) ?? null,
            createdAt: log.createdAt,
        };
    }
}
