import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    const tokenData = this.authService.validateRequest(request);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Add user info to request
    request.user = {
      id: tokenData.userId,
      email: tokenData.email
    };

    return true;
  }
}