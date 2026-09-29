export interface InstitutionEntity {
    id: number;
    name: string;
    acronym: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface InstitutionWithCount extends InstitutionEntity {
    _count: { users: number };
}

export interface InstitutionAdapted {
    id: string;
    name: string;
    acronym: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    researchersCount: number;
}
