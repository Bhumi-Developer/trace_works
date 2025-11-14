import { Injectable, UnauthorizedException, BadRequestException, Res, Req } from '@nestjs/common';
import { TokenService, TokenPayload } from './token.service';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private databaseService: DatabaseService
  ) {}

  async signIn(email: string, password: string, res: any) {
    const user = await this.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

    // Set cookies for automatic authentication
    this.setTokenCookies(res, accessToken, refreshToken);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: '15 minutes'
      }
    };
  }

  async signUp(name: string, email: string, password: string): Promise<{ 
    message: string; 
    user: Omit<User, 'password'>;
    tokens?: {
      access_token: string;
      refresh_token: string;
      expires_in: string;
    }
  }> {
    // Validate input
    if (!name || !email || !password) {
      throw new BadRequestException('Name, email, and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    try {
      // Insert user into database
      const result = await this.databaseService.query(
        `INSERT INTO users (name, email, password) 
         VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
        [name, email, hashedPassword]
      );

      const user = result.rows[0];

      // Generate tokens for auto-login after signup
      const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
      const refreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

      return {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: '15 minutes'
        }
      };
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('User with this email already exists');
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async refreshTokens(req: any, res: any) {
    const refreshToken = this.getTokenFromCookie(req, 'refresh_token');
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const payload = this.tokenService.validateToken(refreshToken);
    
    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.tokenService.generateAccessToken(payload.userId, payload.email);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload.userId, payload.email);

    this.tokenService.revokeToken(refreshToken);
    this.setTokenCookies(res, newAccessToken, newRefreshToken);

    return { 
      message: 'Tokens refreshed',
      tokens: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: '15 minutes'
      }
    };
  }

  async logout(req: any, res: any) {
    const accessToken = this.getTokenFromCookie(req, 'access_token');
    const refreshToken = this.getTokenFromCookie(req, 'refresh_token');

    if (accessToken) this.tokenService.revokeToken(accessToken);
    if (refreshToken) this.tokenService.revokeToken(refreshToken);

    this.clearTokenCookies(res);

    return { message: 'Logout successful' };
  }

  validateAccessToken(accessToken: string | null): TokenPayload | null {
    if (!accessToken) return null;

    const payload = this.tokenService.validateToken(accessToken);
    
    if (!payload || payload.type !== 'access') {
      return null;
    }

    return payload;
  }

  validateRequest(req: any): TokenPayload | null {
    const accessToken = this.getTokenFromCookie(req, 'access_token');
    return this.validateAccessToken(accessToken);
  }

  private async validateCredentials(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database error in findUserByEmail:', error);
      return null;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const salt = crypto.randomBytes(16).toString('hex');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const hash = derivedKey.toString('hex');
        resolve(`${salt}:${hash}`);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const [salt, hash] = storedHash.split(':');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const hashBuffer = Buffer.from(hash, 'hex');
        const derivedKeyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
        
        resolve(crypto.timingSafeEqual(hashBuffer, derivedKeyBuffer));
      } catch (error) {
        reject(error);
      }
    });
  }

  private setTokenCookies(res: any, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh'
    });
  }

  private clearTokenCookies(res: any) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  private getTokenFromCookie(req: any, cookieName: string): string | null {
    return req.cookies?.[cookieName] || null;
  }
}