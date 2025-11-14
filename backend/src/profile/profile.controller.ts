import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';

@Controller('profile')
@UseGuards(SessionGuard)
export class ProfileController {
  
  @Get('me')
  getProfile(@Req() request: any) {
    return {
      message: 'This is a protected route',
      user: request.user,
      timestamp: new Date().toISOString()
    };
  }

  @Get('settings')
  getSettings(@Req() request: any) {
    return {
      message: 'User settings',
      user_id: request.user.id,
      preferences: {
        theme: 'dark',
        notifications: true
      }
    };
  }
}