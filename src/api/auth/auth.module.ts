import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from 'src/shared/services/supabase/supabase.service';
import { PrismaService } from 'src/shared/services/prisma';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, PrismaService, JwtAuthGuard],
})
export class AuthModule {}
