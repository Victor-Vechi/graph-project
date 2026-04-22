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
