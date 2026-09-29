import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UserRepository } from '../infra/user.repository';
import { RoleService } from '../../Role/application/role.service';
import { InstitutionService } from '../../Institution/application/institution.service';
import { JwtAuthService } from '../../Shared/Auth/application/jwt.service';
import { UserAdapted, UserEntity, UserShowAdapted, UserWithInstitution } from '../domain/user.entity';

@Injectable()
export class UserService {
    private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleService: RoleService,
        private readonly institutionService: InstitutionService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    async create(data: {
        name: string;
        email: string;
        password: string;
        idRole: number;
        searchArea?: string;
        subjects?: string;
        idInstitution?: number | null;
    }): Promise<UserEntity | null> {
        if (!data.email || !data.password || !data.name || !data.idRole) return null;
        if (!this.emailRegex.test(data.email)) return null;

        data.email = data.email.toLowerCase();

        if (await this.userRepository.findByEmail(data.email)) return null;
        if (!await this.roleService.findById(data.idRole)) return null;

        const idInstitution = data.idInstitution ? Number(data.idInstitution) : null;
        if (idInstitution && !await this.institutionService.findById(idInstitution)) return null;

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(data.password, salt);

        return this.userRepository.create({
            name: data.name,
            email: data.email,
            password: passwordHash,
            idRole: data.idRole,
            searchArea: data.searchArea? data.searchArea : '',
            subjects: data.subjects? data.subjects : '',
            showUser: false,
            idInstitution,
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
        });
    }

    async login(data: {
        email: string;
        password: string;
    }): Promise<{ user: UserAdapted; token: string; refreshToken: string } | null> {
        if (!data.email || !data.password || !this.emailRegex.test(data.email)) return null;

        data.email = data.email.toLowerCase();
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) return null;
        if (!await bcrypt.compare(data.password, user.password)) return null;

        const adapted = this.toAdapted(user);
        const role = adapted.idRole ? await this.roleService.findById(adapted.idRole) : null;
        if (!role) return null;

        const token = this.jwtAuthService.generateToken(adapted, role.roleName);
        const refreshToken = this.jwtAuthService.generateRefreshToken(adapted.id);

        return { user: adapted, token, refreshToken };
    }

    async delete(data: { email: string }): Promise<{ user: UserAdapted; deleted: boolean } | null> {
        if (!data.email || !this.emailRegex.test(data.email)) return null;

        data.email = data.email.toLowerCase();
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) return null;

        await this.userRepository.delete(user.id);
        return { user: this.toAdapted(user), deleted: true };
    }

    async findAll(): Promise<UserAdapted[]> {
        const users = await this.userRepository.findAll();
        return users.map(u => this.toAdapted(u));
    }

    async findById(id: number): Promise<UserAdapted | null> {
        if (!id) return null;
        const user = await this.userRepository.findById(id);
        return user ? this.toAdapted(user) : null;
    }

    // asAdmin permite alterar também o vínculo com a instituição (idInstitution nulo desvincula)
    async update(
        id: number,
        data: {
            name: string;
            email: string;
            searchArea?: string;
            subjects?: string;
            showUser?: boolean;
            idInstitution?: number | null;
        },
        options: { asAdmin: boolean } = { asAdmin: false },
    ): Promise<UserEntity | null> {
        if (!id || !data.name) return null;
        if (!data.email || !this.emailRegex.test(data.email)) return null;
        if (!await this.userRepository.findById(id)) return null;

        const email = data.email.toLowerCase();
        const userByEmail = await this.userRepository.findByEmail(email);
        if (userByEmail && userByEmail.id !== id) return null;

        let idInstitution: number | null | undefined;
        if (options.asAdmin && data.idInstitution !== undefined) {
            idInstitution = data.idInstitution ? Number(data.idInstitution) : null;
            if (idInstitution && !await this.institutionService.findById(idInstitution)) return null;
        }

        return this.userRepository.update(id, {
            name: data.name,
            email,
            searchArea: data.searchArea,
            subjects: data.subjects,
            showUser: data.showUser,
            ...(idInstitution !== undefined && { idInstitution }),
            updatedAt: new Date(),
        });
    }

    async updatePassword(data: {
        user: { id: string; email: string };
        password: string;
        newPassword: string;
    }): Promise<UserEntity | null> {
        if (!data.user?.id || !data.password || !data.newPassword) return null;

        const user = await this.userRepository.findById(parseInt(data.user.id));
        if (!user) return null;
        if (!await bcrypt.compare(data.password, user.password)) return null;

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(data.newPassword, salt);

        return this.userRepository.update(parseInt(data.user.id), {
            password: passwordHash,
            updatedAt: new Date(),
        });
    }

    async findUsersToShow(): Promise<UserShowAdapted[]> {
        const users = await this.userRepository.findByShowUserTrue();
        return users.map(u => this.toAdaptedShow(u));
    }

    private toAdapted(user: UserEntity): UserAdapted {
        return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            subjects: user.subjects,
            searchArea: user.searchArea,
            showUser: user.showUser,
            idRole: user.idRole,
            idInstitution: user.idInstitution,
        };
    }

    private toAdaptedShow(user: UserWithInstitution): UserShowAdapted {
        return {
            id: user.id.toString(),
            name: user.name,
            searchArea: user.searchArea,
            subjects: user.subjects,
            institution: user.institution
                ? { id: user.institution.id.toString(), name: user.institution.name, acronym: user.institution.acronym }
                : null,
        };
    }
}
