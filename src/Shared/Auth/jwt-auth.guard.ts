import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) throw new UnauthorizedException({ error: 'Unauthorized', code: 'no_token' });

        try {
            request['user'] = this.jwtService.verify(token);
            return true;
        } catch (err: any) {
            const code = err?.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
            throw new UnauthorizedException({ error: 'Unauthorized', code });
        }
    }

    private extractToken(req: Request): string | null {
        const [type, token] = (req.headers.authorization ?? '').split(' ');
        return type === 'Bearer' && token ? token : null;
    }
}
