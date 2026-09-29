import { Module } from '@nestjs/common';
import { PostLogController } from './infra/post-log.controller';
import { PostLogService } from './application/post-log.service';
import { PostLogRepository } from './infra/post-log.repository';

@Module({
    controllers: [PostLogController],
    providers: [PostLogService, PostLogRepository],
    exports: [PostLogService],
})
export class PostLogModule {}
