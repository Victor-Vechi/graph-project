import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
    id: string;
    name: string;
    email: string;
    cargo: string;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    id: string;
    type: 'refresh';
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtAuthService {
    constructor(private readonly jwtService: JwtService) {}

    generateToken(user: { id: string; name: string; email: string }, roleName: string): string {
        return this.jwtService.sign(
            { id: user.id, name: user.name, email: user.email, cargo: roleName },
            { expiresIn: '2h' },
        );
    }

    generateRefreshToken(userId: string): string {
        return this.jwtService.sign({ id: userId, type: 'refresh' }, { expiresIn: '7d' });
    }

    verifyRefreshToken(token: string): RefreshTokenPayload | null {
        try {
            const decoded = this.jwtService.verify<RefreshTokenPayload>(token);
            return decoded.type === 'refresh' ? decoded : null;
        } catch {
            return null;
        }
    }
}
