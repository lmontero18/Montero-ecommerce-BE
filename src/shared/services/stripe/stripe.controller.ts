import {
  Controller,
  Post,
  Body,
  RawBody,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  async checkout(@Body() body: { items: any[] }) {
    if (!body?.items || !Array.isArray(body.items)) {
      throw new BadRequestException('Items array is required');
    }

    console.log('🛒 Items received:', body.items);

    const session = await this.stripeService.createCheckoutSession(body.items);
    return { id: session.id };
  }

  @Post('webhook')
  handleWebhook(@Req() req: Request): any {
    const sig = req.headers['stripe-signature'];
    const rawBody = (req as any).rawBody;

    const event = this.stripeService.constructEvent(rawBody, sig);
    return this.stripeService.handleEvent(event);
  }
}
