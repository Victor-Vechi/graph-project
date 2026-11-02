import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../Shared/Database/application/prisma.service';
import { IStatsRepository } from '../domain/stats-repository.interface';
import { ACTIVE_RESEARCHER } from '../../User/infra/user.filters';
import { PARTNER_INSTITUTION } from '../../Institution/infra/institution.filters';

@Injectable()
export class StatsRepository implements IStatsRepository {
    constructor(private readonly prisma: PrismaService) {}

    countActiveResearchers(): Promise<number> {
        return this.prisma.user.count({ where: ACTIVE_RESEARCHER });
    }

    countPosts(): Promise<number> {
        return this.prisma.post.count();
    }

    countPartnerInstitutions(): Promise<number> {
        return this.prisma.institution.count({ where: PARTNER_INSTITUTION });
    }
}
