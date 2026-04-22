import { PostEntity } from './post.entity';

export interface IPostRepository {
    create(data: { title: string; content: string; tags: number[]; createdAt: Date; updatedAt: Date; active: boolean }): Promise<PostEntity>;
    findById(id: number): Promise<PostEntity | null>;
    findExactTitle(title: string): Promise<PostEntity | null>;
    findByTitle(title: string): Promise<PostEntity[]>;
    findByTag(tagName: string): Promise<PostEntity[]>;
    findAll(): Promise<PostEntity[]>;
    update(id: number, data: { title: string; content: string; tags: number[]; updatedAt: Date }): Promise<PostEntity>;
    delete(id: number): Promise<PostEntity>;
}
