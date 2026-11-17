import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IUserRepository } from '../domain/user-repository.interface';
import { UserEntity, UserWithInstitution } from '../domain/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<UserEntity, 'id' | 'photoMedia'>): Promise<UserEntity> {
        return this.prisma.user.create({ data });
    }

    findById(id: number): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({ where: { id }, include: { photoMedia: true } });
    }

    findByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({ where: { email }, include: { photoMedia: true } });
    }

    findAll(): Promise<UserEntity[]> {
        return this.prisma.user.findMany({ include: { photoMedia: true } });
    }

    findByShowUserTrue(): Promise<UserWithInstitution[]> {
        return this.prisma.user.findMany({
            where: { showUser: true, active: true },
            include: { photoMedia: true, institution: { select: { id: true, name: true, acronym: true } } },
        });
    }

    update(id: number, data: Partial<Omit<UserEntity, 'photoMedia'>>): Promise<UserEntity> {
        return this.prisma.user.update({ where: { id }, data });
    }

    delete(id: number): Promise<UserEntity> {
        return this.prisma.user.delete({ where: { id } });
    }
}
