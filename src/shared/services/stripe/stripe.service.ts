import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from 'src/api/products/products.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private productService: ProductsService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2025-04-30.basil', // ✅ versión estable
      },
    );
  }

  constructEvent(rawBody: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.get('STRIPE_WEBHOOK_SECRET')!,
    );
  }

  async handleEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = session.metadata;
      console.log('🧠 Metadata recibida:', session.metadata); // 👈 VER AQUÍ
      const items = JSON.parse(metadata?.items || '[]');

      await this.productService.decreaseStock(items);
    }

    return { received: true };
  }

  async createCheckoutSession(
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }>,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100), // ✅ conversión a centavos
        },
        quantity: item.quantity,
      })),
      success_url: this.configService.get<string>('FRONTEND_SUCCESS_URL'),
      cancel_url: this.configService.get<string>('FRONTEND_CANCEL_URL'),
    });

    return session;
  }
}
