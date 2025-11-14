import { Injectable } from '@nestjs/common';

export interface TokenPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
  exp: number;
}

@Injectable()
export class TokenService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  private tokenStore = new Map<string, TokenPayload>();

  generateAccessToken(userId: number, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'access',
      exp: Date.now() + this.ACCESS_TOKEN_EXPIRY
    };
    
    const token = this.encodeToken(payload);
    this.tokenStore.set(token, payload);
    return token;
  }

  generateRefreshToken(userId: number, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'refresh',
      exp: Date.now() + this.REFRESH_TOKEN_EXPIRY
    };
    
    const token = this.encodeToken(payload);
    this.tokenStore.set(token, payload);
    return token;
  }

  validateToken(token: string): TokenPayload | null {
    const payload = this.tokenStore.get(token);
    
    if (!payload || payload.exp < Date.now()) {
      this.tokenStore.delete(token);
      return null;
    }
    
    return payload;
  }

  revokeToken(token: string): void {
    this.tokenStore.delete(token);
  }

  revokeAllUserTokens(userId: number): void {
    for (const [token, payload] of this.tokenStore.entries()) {
      if (payload.userId === userId) {
        this.tokenStore.delete(token);
      }
    }
  }

  private encodeToken(payload: TokenPayload): string {
    const tokenString = JSON.stringify(payload);
    return Buffer.from(tokenString).toString('base64url');
  }
}