import { Module } from '@nestjs/common';
import { TagController } from './infra/tag.controller';
import { TagService } from './application/tag.service';
import { TagRepository } from './infra/tag.repository';

@Module({
    controllers: [TagController],
    providers: [TagService, TagRepository],
    exports: [TagService],
})
export class TagModule {}
