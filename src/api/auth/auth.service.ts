import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/shared/services/supabase/supabase.service';
import { SignUpDto, SignInDto } from './dto';
import { PrismaService } from 'src/shared/services/prisma';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async signUp(dto: SignUpDto) {
    const { email, password } = dto;
    const result = await this.supabase.signUp(email, password);

    const supabaseUser = result.user;
    if (!supabaseUser) throw new Error('Supabase did not return a user');

    const userExists = await this.prisma.user.findUnique({
      where: { uuid: supabaseUser.id },
    });

    if (!userExists) {
      await this.prisma.user.create({
        data: {
          uuid: supabaseUser.id,
          email: supabaseUser.email!,
        },
      });
    }

    return {
      message: 'User registered',
      user: supabaseUser,
    };
  }

  async login(dto: SignInDto) {
    const { email, password } = dto;
    const result = await this.supabase.signIn(email, password);
    const supabaseUser = result.user;

    if (!supabaseUser) throw new Error('Login failed');

    let localUser = await this.prisma.user.findUnique({
      where: { uuid: supabaseUser.id },
    });

    if (!localUser) {
      localUser = await this.prisma.user.create({
        data: {
          uuid: supabaseUser.id,
          email: supabaseUser.email!,
        },
      });
    }

    const token = jwt.sign(
      { sub: localUser.id, email: localUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      accessToken: token,
      user: supabaseUser,
    };
  }
}
