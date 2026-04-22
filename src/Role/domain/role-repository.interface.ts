import { RoleEntity } from './role.entity';

export interface IRoleRepository {
    create(data: Omit<RoleEntity, 'id'>): Promise<RoleEntity>;
    findById(id: number): Promise<RoleEntity | null>;
    findByName(name: string): Promise<RoleEntity | null>;
    findAll(): Promise<RoleEntity[]>;
    update(id: number, data: Partial<RoleEntity>): Promise<RoleEntity>;
    delete(id: number): Promise<RoleEntity>;
}
