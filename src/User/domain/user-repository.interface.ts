import { UserEntity } from './user.entity';

export interface IUserRepository {
    create(data: Omit<UserEntity, 'id'>): Promise<UserEntity>;
    findById(id: number): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(): Promise<UserEntity[]>;
    findByShowUserTrue(): Promise<UserEntity[]>;
    update(id: number, data: Partial<UserEntity>): Promise<UserEntity>;
    delete(id: number): Promise<UserEntity>;
}
