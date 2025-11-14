import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  Get, 
  Res,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session.guard';

interface SignUpResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
}

interface SignInResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpData: any): Promise<SignUpResponse> {
    return this.authService.signUp(
      signUpData.name,
      signUpData.email,
      signUpData.password
    );
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginData: { email: string; password: string },
    @Res({ passthrough: true }) res: any
  ): Promise<SignInResponse> {
    return this.authService.signIn(loginData.email, loginData.password, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ) {
    return this.authService.refreshTokens(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ) {
    return this.authService.logout(req, res);
  }

  @Get('profile')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@Req() req: any) {
    return {
      user: req.user,
      message: 'Profile accessed successfully'
    };
  }

  @Get('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Req() req: any) {
    const tokenData = this.authService.validateRequest(req);
    
    if (!tokenData) {
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: tokenData.userId,
        email: tokenData.email
      },
      expires_at: new Date(tokenData.exp).toISOString()
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return { 
      status: 'OK', 
      message: 'Auth service is running',
      timestamp: new Date().toISOString()
    };
  }
}