import { Module } from '@nestjs/common';
import { RoleController } from './infra/role.controller';
import { RoleService } from './application/role.service';
import { RoleRepository } from './infra/role.repository';

@Module({
    controllers: [RoleController],
    providers: [RoleService, RoleRepository],
    exports: [RoleService],
})
export class RoleModule {}
