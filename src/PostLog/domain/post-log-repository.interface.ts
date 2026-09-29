import { PostLogEntity, PostSnapshot } from './post-log.entity';

export interface IPostLogRepository {
    create(data: Omit<PostLogEntity, 'id' | 'createdAt'>): Promise<PostLogEntity>;
    findAll(postId?: number): Promise<PostLogEntity[]>;
    findPostSnapshot(postId: number): Promise<PostSnapshot | null>;
}
