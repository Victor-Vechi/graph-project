export interface TagEntity {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}
