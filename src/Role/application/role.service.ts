import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../infra/role.repository';
import { RoleAdapted, RoleEntity } from '../domain/role.entity';

@Injectable()
export class RoleService {
    constructor(private readonly roleRepository: RoleRepository) {}

    async findById(id: number): Promise<RoleAdapted | null> {
        if (!id) return null;
        const role = await this.roleRepository.findById(id);
        return role ? this.toAdapted(role) : null;
    }

    async create(data: { name: string; description: string }): Promise<RoleEntity | null> {
        if (!data.name || !data.description) return null;
        if (await this.roleRepository.findByName(data.name)) return null;

        return this.roleRepository.create({
            name: data.name,
            description: data.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
        });
    }

    async findAll(): Promise<RoleAdapted[]> {
        const roles = await this.roleRepository.findAll();
        return roles.map(r => this.toAdapted(r));
    }

    async update(id: number, data: { name: string; description: string }): Promise<RoleEntity | null> {
        if (!id || !data.name || !data.description) return null;

        const existing = await this.roleRepository.findByName(data.name);
        if (existing && existing.id !== id) return null;

        return this.roleRepository.update(id, { ...data, updatedAt: new Date() });
    }

    async delete(id: number): Promise<boolean> {
        if (!id) return false;
        if (!await this.roleRepository.findById(id)) return false;
        await this.roleRepository.delete(id);
        return true;
    }

    toAdapted(role: RoleEntity): RoleAdapted {
        return {
            id: role.id.toString(),
            roleName: role.name,
            description: role.description,
        };
    }
}
