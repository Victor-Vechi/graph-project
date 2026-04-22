import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IRoleRepository } from '../domain/role-repository.interface';
import { RoleEntity } from '../domain/role.entity';

@Injectable()
export class RoleRepository implements IRoleRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<RoleEntity, 'id'>): Promise<RoleEntity> {
        return this.prisma.role.create({ data });
    }

    findById(id: number): Promise<RoleEntity | null> {
        return this.prisma.role.findUnique({ where: { id } });
    }

    findByName(name: string): Promise<RoleEntity | null> {
        return this.prisma.role.findFirst({ where: { name } });
    }

    findAll(): Promise<RoleEntity[]> {
        return this.prisma.role.findMany();
    }

    update(id: number, data: Partial<RoleEntity>): Promise<RoleEntity> {
        return this.prisma.role.update({ where: { id }, data });
    }

    delete(id: number): Promise<RoleEntity> {
        return this.prisma.role.delete({ where: { id } });
    }
}
