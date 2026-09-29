export type PostLogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type PostLogField = 'title' | 'content' | 'tags';

export interface PostSnapshot {
    title: string;
    content: string;
    tags: string[];
}

export interface PostLogEntity {
    id: number;
    postId: number | null;
    userId: number | null;
    action: string;
    postTitle: string;
    userName: string;
    changes: string[];
    before: unknown;
    after: unknown;
    createdAt: Date;
}

export interface PostLogAdapted {
    id: string;
    postId: string | null;
    postTitle: string;
    userId: string | null;
    userName: string;
    action: PostLogAction;
    changes: PostLogField[];
    before: PostSnapshot | null;
    after: PostSnapshot | null;
    createdAt: Date;
}
