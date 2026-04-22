import { Injectable } from '@nestjs/common';
import { TagRepository } from '../infra/tag.repository';
import { TagEntity } from '../domain/tag.entity';

@Injectable()
export class TagService {
    constructor(private readonly tagRepository: TagRepository) {}

    async create(data: { name: string; description: string }): Promise<TagEntity | null> {
        if (!data.name || !data.description) return null;
        if (await this.tagRepository.findByName(data.name)) return null;

        return this.tagRepository.create({
            name: data.name,
            description: data.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
        });
    }

    async update(id: number, data: { name: string; description: string }): Promise<TagEntity | null> {
        if (!data.name || !data.description) return null;
        return this.tagRepository.update(id, { ...data, updatedAt: new Date() });
    }

    async delete(id: number): Promise<boolean> {
        if (!id) return false;
        const tag = await this.tagRepository.findById(id);
        if (!tag) return false;
        await this.tagRepository.delete(id);
        return true;
    }

    async findByName(name: string): Promise<TagEntity | null> {
        return this.tagRepository.findByName(name);
    }

    async findAll(): Promise<TagEntity[]> {
        return this.tagRepository.findAll();
    }
}
