export class LoginDto {
  static validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Email validation
    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email format is invalid');
      }
    }

    // Password validation
    if (!data.password || data.password.length === 0) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}