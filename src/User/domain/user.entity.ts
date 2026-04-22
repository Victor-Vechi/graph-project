export interface UserEntity {
    id: number;
    name: string;
    email: string;
    password: string;
    idRole: number | null;
    searchArea: string | null;
    subjects: string | null;
    showUser: boolean;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface UserAdapted {
    id: string;
    name: string;
    email: string;
    subjects: string | null;
    searchArea: string | null;
    showUser: boolean;
    idRole: number | null;
}

export interface UserShowAdapted {
    id: string;
    name: string;
    searchArea: string | null;
    subjects: string | null;
}
