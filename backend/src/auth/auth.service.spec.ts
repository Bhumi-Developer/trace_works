import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, TokenService],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    tokenService = moduleRef.get<TokenService>(TokenService);
  });

  describe('signIn', () => {
    const testCases = [
      {
        name: 'should login with valid credentials',
        email: 'test@example.com',
        password: 'password123',
        expected: { success: true, hasUser: true }
      },
      {
        name: 'should reject invalid email',
        email: 'wrong@example.com',
        password: 'password123',
        expected: { success: false, error: 'Invalid credentials' }
      },
      {
        name: 'should reject wrong password',
        email: 'test@example.com',
        password: 'wrongpassword',
        expected: { success: false, error: 'Invalid credentials' }
      }
    ];

    test.each(testCases)('$name', async ({ email, password, expected }) => {
      if (expected.success) {
        const mockResponse = { cookie: jest.fn() } as any;
        const result = await authService.signIn(email, password, mockResponse);
        
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(email);
        expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      } else {
        await expect(authService.signIn(email, password, {} as any))
          .rejects.toThrow(expected.error);
      }
    });
  });

  describe('token validation', () => {
    const tokenValidationCases = [
      {
        name: 'should validate valid token',
        tokenType: 'access' as const,
        shouldExpire: false,
        expectedValid: true
      },
      {
        name: 'should reject expired token',
        tokenType: 'access' as const,
        shouldExpire: true,
        expectedValid: false
      },
      {
        name: 'should validate refresh token',
        tokenType: 'refresh' as const,
        shouldExpire: false,
        expectedValid: true
      }
    ];

    test.each(tokenValidationCases)('$name', ({ tokenType, shouldExpire, expectedValid }) => {
      const token = tokenType === 'access' 
        ? tokenService.generateAccessToken(1, 'test@example.com')
        : tokenService.generateRefreshToken(1, 'test@example.com');

      if (shouldExpire) {
        // Manipulate token expiry (simplified)
        jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000000);
      }

      const isValid = !!tokenService.validateToken(token);
      expect(isValid).toBe(expectedValid);
    });
  });
});