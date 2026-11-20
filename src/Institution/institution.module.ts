import { Module } from '@nestjs/common';
import { InstitutionController } from './infra/institution.controller';
import { InstitutionService } from './application/institution.service';
import { InstitutionRepository } from './infra/institution.repository';
import { MediaModule } from '../Shared/Media/media.module';

@Module({
    imports: [MediaModule],
    controllers: [InstitutionController],
    providers: [InstitutionService, InstitutionRepository],
    exports: [InstitutionService],
})
export class InstitutionModule {}
