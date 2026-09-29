import { Module } from '@nestjs/common';
import { InstitutionController } from './infra/institution.controller';
import { InstitutionService } from './application/institution.service';
import { InstitutionRepository } from './infra/institution.repository';

@Module({
    controllers: [InstitutionController],
    providers: [InstitutionService, InstitutionRepository],
    exports: [InstitutionService],
})
export class InstitutionModule {}
