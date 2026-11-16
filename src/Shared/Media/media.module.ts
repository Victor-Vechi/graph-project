import { Module } from '@nestjs/common';
import { MediaService } from './application/media.service';
import { MediaRepository } from './infra/media.repository';

@Module({
    providers: [MediaService, MediaRepository],
    exports: [MediaService],
})
export class MediaModule {}
