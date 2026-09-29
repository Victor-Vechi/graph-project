import { PostEntity } from './post.entity';

export interface CreatePostData {
    title: string;
    content: string;
    tags: number[];
    userId: number;
    coverMediaId?: string | null;
    coverAlt?: string | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface UpdatePostData {
    title: string;
    content: string;
    tags: number[];
    coverMediaId?: string | null;
    coverAlt?: string | null;
    updatedAt: Date;
}

export interface IPostRepository {
    create(data: CreatePostData): Promise<PostEntity>;
    findById(id: number): Promise<PostEntity | null>;
    findExactTitle(title: string): Promise<PostEntity | null>;
    findByTitle(title: string): Promise<PostEntity[]>;
    findByTag(tagName: string): Promise<PostEntity[]>;
    findAll(): Promise<PostEntity[]>;
    update(id: number, data: UpdatePostData): Promise<PostEntity>;
    delete(id: number): Promise<PostEntity>;
}
