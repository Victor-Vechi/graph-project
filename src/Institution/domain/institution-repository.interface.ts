import { InstitutionEntity, InstitutionWithCount } from './institution.entity';

export interface IInstitutionRepository {
    create(data: Omit<InstitutionEntity, 'id'>): Promise<InstitutionEntity>;
    findById(id: number): Promise<InstitutionEntity | null>;
    findByName(name: string): Promise<InstitutionEntity | null>;
    findAll(): Promise<InstitutionWithCount[]>;
    findActiveWithResearchers(): Promise<InstitutionWithCount[]>;
    update(id: number, data: Partial<InstitutionEntity>): Promise<InstitutionEntity>;
    delete(id: number): Promise<InstitutionEntity>;
}
