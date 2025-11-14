import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private blacklistedTokens: Set<string> = new Set();

  // Add token to blacklist
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  // Check if token is blacklisted
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  // Remove expired tokens (optional cleanup method)
  cleanupExpiredTokens(): void {
    // This is a simple implementation - in production, you might want
    // to implement a more sophisticated cleanup mechanism
    console.log('Current blacklisted tokens count:', this.blacklistedTokens.size);
  }

  // Get blacklisted tokens count (for monitoring)
  getBlacklistedCount(): number {
    return this.blacklistedTokens.size;
  }
}