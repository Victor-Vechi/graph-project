import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { MaterialEntity } from '../domain/material.entity';

const INCLUDE_MATERIAL_RELATIONS = {
    media: true,
    uploadedBy: { select: { id: true, name: true } },
} as const;

interface CreateMaterialData {
    title: string;
    description: string | null;
    category: string | null;
    year: number | null;
    tags: string[];
    mediaId: string;
    uploadedById: number;
    active: boolean;
}

type UpdateMaterialData = Partial<Omit<CreateMaterialData, 'uploadedById'>>;

@Injectable()
export class MaterialRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: CreateMaterialData): Promise<MaterialEntity> {
        return this.prisma.material.create({
            data,
            include: INCLUDE_MATERIAL_RELATIONS,
        }) as Promise<MaterialEntity>;
    }

    findById(id: number): Promise<MaterialEntity | null> {
        return this.prisma.material.findUnique({
            where: { id },
            include: INCLUDE_MATERIAL_RELATIONS,
        }) as Promise<MaterialEntity | null>;
    }

    findAll(): Promise<MaterialEntity[]> {
        return this.prisma.material.findMany({
            where: { active: true },
            include: INCLUDE_MATERIAL_RELATIONS,
            orderBy: { createdAt: 'desc' },
        }) as Promise<MaterialEntity[]>;
    }

    update(id: number, data: UpdateMaterialData): Promise<MaterialEntity> {
        return this.prisma.material.update({
            where: { id },
            data,
            include: INCLUDE_MATERIAL_RELATIONS,
        }) as Promise<MaterialEntity>;
    }

    delete(id: number): Promise<MaterialEntity> {
        return this.prisma.material.delete({ where: { id } }) as Promise<MaterialEntity>;
    }
}
