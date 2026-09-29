import { Controller, Get, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PostLogService } from '../application/post-log.service';
import { AdminGuard } from '../../Shared/Auth/infra/admin.guard';

@Controller('api/post-logs')
export class PostLogController {
    constructor(private readonly postLogService: PostLogService) {}

    @Get()
    @UseGuards(AdminGuard)
    async findAll(@Query('postId') postId: string | undefined, @Res() res: Response) {
        try {
            const logs = await this.postLogService.findAll(postId ? parseInt(postId) : undefined);
            return res.status(HttpStatus.OK).json({ logs });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching post logs' });
        }
    }
}
