import { Module } from '@nestjs/common';
import { UserController } from './infra/user.controller';
import { UserService } from './application/user.service';
import { UserRepository } from './infra/user.repository';
import { RoleModule } from '../Role/role.module';

@Module({
    imports: [RoleModule],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [UserService],
})
export class UserModule {}
