import { Injectable } from '@nestjs/common';
import { InstitutionRepository } from '../infra/institution.repository';
import { InstitutionAdapted, InstitutionEntity, InstitutionWithCount } from '../domain/institution.entity';
import { PhotoInput, PhotoService } from '../../Shared/Media/application/photo.service';

type InstitutionInput = PhotoInput & {
    name: string;
    acronym?: string;
    city?: string;
    country?: string;
    website?: string;
    active?: boolean;
};

@Injectable()
export class InstitutionService {
    constructor(
        private readonly institutionRepository: InstitutionRepository,
        private readonly photoService: PhotoService,
    ) {}

    async findById(id: number): Promise<InstitutionEntity | null> {
        if (!id) return null;
        return this.institutionRepository.findById(id);
    }

    async create(data: InstitutionInput): Promise<InstitutionEntity | null> {
        const name = data.name?.trim();
        if (!name) return null;
        if (await this.institutionRepository.findByName(name)) return null;

        return this.photoService.save(data, null, null, photoMediaId => this.institutionRepository.create({
            name,
            acronym: data.acronym?.trim() || null,
            city: data.city?.trim() || null,
            country: data.country?.trim() || null,
            website: data.website?.trim() || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
            photoMediaId,
        }));
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
        const current = await this.institutionRepository.findById(id);
        if (!current) return null;

        const existing = await this.institutionRepository.findByName(name);
        if (existing && existing.id !== id) return null;

        return this.photoService.save(data, current.photoMediaId, null, photoMediaId => this.institutionRepository.update(id, {
            name,
            acronym: data.acronym?.trim() || null,
            city: data.city?.trim() || null,
            country: data.country?.trim() || null,
            website: data.website?.trim() || null,
            ...(typeof data.active === 'boolean' && { active: data.active }),
            updatedAt: new Date(),
            photoMediaId,
        }));
    }

    async delete(id: number): Promise<boolean> {
        if (!id) return false;
        const current = await this.institutionRepository.findById(id);
        if (!current) return false;
        await this.institutionRepository.delete(id);
        await this.photoService.cleanup(current.photoMediaId);
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
            photo: this.photoService.toResponse(institution.photoMedia, institution.name),
        };
    }
}
