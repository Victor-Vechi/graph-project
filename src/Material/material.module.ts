import { Module } from '@nestjs/common';
import { MediaModule } from '../Shared/Media/media.module';
import { MaterialService } from './application/material.service';
import { MaterialController } from './infra/material.controller';
import { MaterialRepository } from './infra/material.repository';

@Module({
    imports: [MediaModule],
    controllers: [MaterialController],
    providers: [MaterialService, MaterialRepository],
})
export class MaterialModule {}
