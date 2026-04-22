import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { ITagRepository } from '../domain/tag-repository.interface';
import { TagEntity } from '../domain/tag.entity';

@Injectable()
export class TagRepository implements ITagRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<TagEntity, 'id'>): Promise<TagEntity> {
        return this.prisma.tag.create({ data });
    }

    findById(id: number): Promise<TagEntity | null> {
        return this.prisma.tag.findUnique({ where: { id } });
    }

    findByName(name: string): Promise<TagEntity | null> {
        return this.prisma.tag.findFirst({ where: { name } });
    }

    findAll(): Promise<TagEntity[]> {
        return this.prisma.tag.findMany();
    }

    update(id: number, data: Partial<TagEntity>): Promise<TagEntity> {
        return this.prisma.tag.update({ where: { id }, data });
    }

    delete(id: number): Promise<TagEntity> {
        return this.prisma.tag.delete({ where: { id } });
    }
}
