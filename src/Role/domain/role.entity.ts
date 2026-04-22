export interface RoleEntity {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface RoleAdapted {
    id: string;
    roleName: string;
    description: string | null;
}
