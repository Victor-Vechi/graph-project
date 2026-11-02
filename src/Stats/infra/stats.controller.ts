import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { StatsService } from '../application/stats.service';

@Controller('api/stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get()
    async getStats(@Res() res: Response) {
        try {
            const stats = await this.statsService.getStats();
            return res.status(HttpStatus.OK).json(stats);
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching stats' });
        }
    }
}
