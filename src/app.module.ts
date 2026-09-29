import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MaterialModule } from './Material/material.module';
import { PostModule } from './Post/post.module';
import { RoleModule } from './Role/role.module';
import { AuthModule } from './Shared/Auth/auth.module';
import { DatabaseModule } from './Shared/Database/database.module';
import { TagModule } from './Tag/tag.module';
import { UserModule } from './User/user.module';
import { InstitutionModule } from './Institution/institution.module';
import { PostLogModule } from './PostLog/post-log.module';

@Module({
    imports: [
        ThrottlerModule.forRoot([{
            name: 'default',
            ttl: 900000,
            limit: 100,
        }]),
        DatabaseModule,
        AuthModule,
        RoleModule,
        UserModule,
        TagModule,
        PostModule,
        MaterialModule,
        InstitutionModule,
        PostLogModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
