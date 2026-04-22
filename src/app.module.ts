import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './Shared/Database/database.module';
import { AuthModule } from './Shared/Auth/auth.module';
import { RoleModule } from './Role/role.module';
import { UserModule } from './User/user.module';
import { TagModule } from './Tag/tag.module';
import { PostModule } from './Post/post.module';

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
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
