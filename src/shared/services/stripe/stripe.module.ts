import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from 'src/api/products/products.controller';
import { ProductsModule } from 'src/api/products/products.module';

@Module({
  imports: [ConfigModule, ProductsModule],
  providers: [StripeService],
  controllers: [StripeController, ProductsController],
})
export class StripeModule {}
