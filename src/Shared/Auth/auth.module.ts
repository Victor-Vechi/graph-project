import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './application/jwt.service';
import { JwtAuthGuard } from './infra/jwt-auth.guard';
import { AdminGuard } from './infra/admin.guard';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.SECRET_KEY,
                signOptions: { expiresIn: '2h' },
            }),
        }),
    ],
    providers: [JwtAuthService, JwtAuthGuard, AdminGuard],
    exports: [JwtModule, JwtAuthService, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
