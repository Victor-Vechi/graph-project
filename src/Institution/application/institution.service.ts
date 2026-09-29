import { Injectable } from '@nestjs/common';
import { InstitutionRepository } from '../infra/institution.repository';
import { InstitutionAdapted, InstitutionEntity, InstitutionWithCount } from '../domain/institution.entity';

type InstitutionInput = {
    name: string;
    acronym?: string;
    city?: string;
    country?: string;
    website?: string;
    active?: boolean;
};

@Injectable()
export class InstitutionService {
    constructor(private readonly institutionRepository: InstitutionRepository) {}

    async findById(id: number): Promise<InstitutionEntity | null> {
        if (!id) return null;
        return this.institutionRepository.findById(id);
    }

    async create(data: InstitutionInput): Promise<InstitutionEntity | null> {
        const name = data.name?.trim();
        if (!name) return null;
        if (await this.institutionRepository.findByName(name)) return null;

        return this.institutionRepository.create({
            name,
            acronym: data.acronym?.trim() || null,
            city: data.city?.trim() || null,
            country: data.country?.trim() || null,
            website: data.website?.trim() || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
        });
    }

    async findAll(): Promise<InstitutionAdapted[]> {
        const institutions = await this.institutionRepository.findAll();
        return institutions.map(i => this.toAdapted(i));
    }

    // Instituições parceiras: ativas e com ao menos um pesquisador ativo vinculado
    async findPartners(): Promise<{ total: number; institutions: InstitutionAdapted[] }> {
        const institutions = await this.institutionRepository.findActiveWithResearchers();
        return { total: institutions.length, institutions: institutions.map(i => this.toAdapted(i)) };
    }

    async update(id: number, data: InstitutionInput): Promise<InstitutionEntity | null> {
        const name = data.name?.trim();
        if (!id || !name) return null;
        if (!await this.institutionRepository.findById(id)) return null;

        const existing = await this.institutionRepository.findByName(name);
        if (existing && existing.id !== id) return null;

        return this.institutionRepository.update(id, {
            name,
            acronym: data.acronym?.trim() || null,
            city: data.city?.trim() || null,
            country: data.country?.trim() || null,
            website: data.website?.trim() || null,
            ...(typeof data.active === 'boolean' && { active: data.active }),
            updatedAt: new Date(),
        });
    }

    async delete(id: number): Promise<boolean> {
        if (!id) return false;
        if (!await this.institutionRepository.findById(id)) return false;
        await this.institutionRepository.delete(id);
        return true;
    }

    toAdapted(institution: InstitutionWithCount): InstitutionAdapted {
        return {
            id: institution.id.toString(),
            name: institution.name,
            acronym: institution.acronym,
            city: institution.city,
            country: institution.country,
            website: institution.website,
            researchersCount: institution._count.users,
        };
    }
}
