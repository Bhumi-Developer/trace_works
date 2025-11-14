import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export class PasswordUtils {
  // Hash password using scrypt
  static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const salt = randomBytes(16).toString('hex');
        const derivedKey = scryptSync(password, salt, 64);
        const hash = derivedKey.toString('hex');
        resolve(`${salt}:${hash}`);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Verify password
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const [salt, hash] = storedHash.split(':');
        const derivedKey = scryptSync(password, salt, 64);
        const hashBuffer = Buffer.from(hash, 'hex');
        const derivedKeyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
        
        resolve(timingSafeEqual(hashBuffer, derivedKeyBuffer));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Validate password strength
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (password.length > 100) {
      errors.push('Password must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}