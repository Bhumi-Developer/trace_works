import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule], // Add this line
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}