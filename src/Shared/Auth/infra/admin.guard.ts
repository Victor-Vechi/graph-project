import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const [type, token] = (request.headers.authorization ?? '').split(' ');

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException({ error: 'Unauthorized', code: 'no_token' });
        }

        try {
            const payload: any = this.jwtService.verify(token);
            if (payload.cargo !== 'admin') {
                throw new UnauthorizedException({ error: 'Unauthorized', code: 'invalid_token' });
            }
            request['user'] = payload;
            return true;
        } catch (err: any) {
            if (err instanceof UnauthorizedException) throw err;
            const code = err?.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
            throw new UnauthorizedException({ error: 'Unauthorized', code });
        }
    }
}
