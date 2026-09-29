import { Module } from '@nestjs/common';
import { StorageModule } from '../Storage/storage.module';
import { MediaService } from './application/media.service';
import { MediaRepository } from './infra/media.repository';

@Module({
    imports: [StorageModule],
    providers: [MediaService, MediaRepository],
    exports: [MediaService],
})
export class MediaModule {}
