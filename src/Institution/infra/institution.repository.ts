import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IInstitutionRepository } from '../domain/institution-repository.interface';
import { InstitutionEntity, InstitutionWithCount } from '../domain/institution.entity';

// Pesquisador ativo = usuário ativo e exibido no site (mesmo critério de /user/show)
const ACTIVE_RESEARCHER = { active: true, showUser: true };

@Injectable()
export class InstitutionRepository implements IInstitutionRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<InstitutionEntity, 'id'>): Promise<InstitutionEntity> {
        return this.prisma.institution.create({ data });
    }

    findById(id: number): Promise<InstitutionEntity | null> {
        return this.prisma.institution.findUnique({ where: { id } });
    }

    findByName(name: string): Promise<InstitutionEntity | null> {
        return this.prisma.institution.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    }

    findAll(): Promise<InstitutionWithCount[]> {
        return this.prisma.institution.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { users: { where: ACTIVE_RESEARCHER } } } },
        });
    }

    findActiveWithResearchers(): Promise<InstitutionWithCount[]> {
        return this.prisma.institution.findMany({
            where: { active: true, users: { some: ACTIVE_RESEARCHER } },
            orderBy: { name: 'asc' },
            include: { _count: { select: { users: { where: ACTIVE_RESEARCHER } } } },
        });
    }

    update(id: number, data: Partial<InstitutionEntity>): Promise<InstitutionEntity> {
        return this.prisma.institution.update({ where: { id }, data });
    }

    delete(id: number): Promise<InstitutionEntity> {
        return this.prisma.institution.delete({ where: { id } });
    }
}
