import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IUserRepository } from '../domain/user-repository.interface';
import { UserEntity } from '../domain/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    create(data: Omit<UserEntity, 'id'>): Promise<UserEntity> {
        return this.prisma.user.create({ data });
    }

    findById(id: number): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    findByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findAll(): Promise<UserEntity[]> {
        return this.prisma.user.findMany();
    }

    findByShowUserTrue(): Promise<UserEntity[]> {
        return this.prisma.user.findMany({ where: { showUser: true } });
    }

    update(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
        return this.prisma.user.update({ where: { id }, data });
    }

    delete(id: number): Promise<UserEntity> {
        return this.prisma.user.delete({ where: { id } });
    }
}
