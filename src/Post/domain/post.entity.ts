export interface PostTagItem {
    id: number;
    name: string;
}

export interface PostEntity {
    id: number;
    title: string;
    content: string;
    userId: number | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    tags?: Array<{ tag: { id: number; name: string } }>;
}

export interface PostAdapted {
    id: string;
    title: string;
    content: string;
    tags: PostTagItem[];
    createdAt: Date;
}
