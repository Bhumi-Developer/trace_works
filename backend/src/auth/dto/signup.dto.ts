export class SignUpDto {
  static validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (data.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }

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
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else if (data.password.length > 100) {
      errors.push('Password must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}