import { Injectable } from '@nestjs/common';
import { StatsRepository } from '../infra/stats.repository';
import { StatsAdapted } from '../domain/stats.entity';

@Injectable()
export class StatsService {
    constructor(private readonly statsRepository: StatsRepository) {}

    async getStats(): Promise<StatsAdapted> {
        const [researchers, posts, institutions] = await Promise.all([
            this.statsRepository.countActiveResearchers(),
            this.statsRepository.countPosts(),
            this.statsRepository.countPartnerInstitutions(),
        ]);

        return { researchers, posts, institutions };
    }
}
