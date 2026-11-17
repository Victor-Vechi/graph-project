import { Module } from '@nestjs/common';
import { MediaService } from './application/media.service';
import { MediaRepository } from './infra/media.repository';
import { PhotoService } from './application/photo.service';

@Module({
    providers: [MediaService, MediaRepository, PhotoService],
    exports: [MediaService, PhotoService],
})
export class MediaModule {}
