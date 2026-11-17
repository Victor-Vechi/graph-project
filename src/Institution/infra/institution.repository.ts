import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IInstitutionRepository } from '../domain/institution-repository.interface';
import { InstitutionEntity, InstitutionWithCount } from '../domain/institution.entity';
import { ACTIVE_RESEARCHER } from '../../User/infra/user.filters';
import { PARTNER_INSTITUTION } from './institution.filters';

@Injectable()
export class InstitutionRepository implements IInstitutionRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<InstitutionEntity, 'id' | 'photoMedia'>): Promise<InstitutionEntity> {
        return this.prisma.institution.create({ data });
    }

    findById(id: number): Promise<InstitutionEntity | null> {
        return this.prisma.institution.findUnique({ where: { id }, include: { photoMedia: true } });
    }

    findByName(name: string): Promise<InstitutionEntity | null> {
        return this.prisma.institution.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    }

    findAll(): Promise<InstitutionWithCount[]> {
        return this.prisma.institution.findMany({
            orderBy: { name: 'asc' },
            include: { photoMedia: true, _count: { select: { users: { where: ACTIVE_RESEARCHER } } } },
        });
    }

    findActiveWithResearchers(): Promise<InstitutionWithCount[]> {
        return this.prisma.institution.findMany({
            where: PARTNER_INSTITUTION,
            orderBy: { name: 'asc' },
            include: { photoMedia: true, _count: { select: { users: { where: ACTIVE_RESEARCHER } } } },
        });
    }

    update(id: number, data: Partial<Omit<InstitutionEntity, 'photoMedia'>>): Promise<InstitutionEntity> {
        return this.prisma.institution.update({ where: { id }, data });
    }

    delete(id: number): Promise<InstitutionEntity> {
        return this.prisma.institution.delete({ where: { id } });
    }
}
