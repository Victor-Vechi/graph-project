import { Module } from '@nestjs/common';
import { StatsController } from './infra/stats.controller';
import { StatsService } from './application/stats.service';
import { StatsRepository } from './infra/stats.repository';

@Module({
    controllers: [StatsController],
    providers: [StatsService, StatsRepository],
})
export class StatsModule {}
