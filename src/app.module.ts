import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './api/products/products.module';
import { PrismaModule } from './shared/services/prisma';
import { SupabaseModule } from './shared/services/supabase/supabase.module';
import { AuthModule } from './api/auth/auth.module';
import { CategoriesModule } from './api/categories/categories.module';
import { StripeModule } from './shared/services/stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ProductsModule,
    PrismaModule,
    SupabaseModule,
    AuthModule,
    CategoriesModule,
    StripeModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
