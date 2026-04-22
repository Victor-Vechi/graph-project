import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './jwt.service';
import { CaptchaService } from './captcha.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

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
    providers: [JwtAuthService, CaptchaService, JwtAuthGuard, AdminGuard],
    exports: [JwtModule, JwtAuthService, CaptchaService, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
