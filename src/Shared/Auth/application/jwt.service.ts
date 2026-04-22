import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, RefreshTokenPayload } from '../domain/jwt.interface';

@Injectable()
export class JwtAuthService {
    constructor(private readonly jwtService: JwtService) {}

    generateToken(user: Pick<JwtPayload, 'id' | 'name' | 'email'>, roleName: string): string {
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
