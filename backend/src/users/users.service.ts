import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordUtils } from '../common/utils/password.utils';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async createUser(name: string, email: string, password: string): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    try {
      const result = await this.databaseService.query(
        `INSERT INTO users (name, email, password) 
         VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
        [name.trim(), email.toLowerCase().trim(), hashedPassword]
      );
      
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    const result = await this.databaseService.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.findByEmail(email);
    if (user && await PasswordUtils.verifyPassword(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const result = await this.databaseService.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows.map(row => new User(row));
  }
}