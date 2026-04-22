import { TagEntity } from './tag.entity';

export interface ITagRepository {
    create(data: Omit<TagEntity, 'id'>): Promise<TagEntity>;
    findById(id: number): Promise<TagEntity | null>;
    findByName(name: string): Promise<TagEntity | null>;
    findAll(): Promise<TagEntity[]>;
    update(id: number, data: Partial<TagEntity>): Promise<TagEntity>;
    delete(id: number): Promise<TagEntity>;
}
