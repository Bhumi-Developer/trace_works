import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { SessionGuard } from './guards/session.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AuthService, TokenService, SessionGuard],
  controllers: [AuthController],
  exports: [AuthService, TokenService, SessionGuard],
})
export class AuthModule {}