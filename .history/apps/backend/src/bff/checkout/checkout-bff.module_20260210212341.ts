import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CheckoutBffController } from './presentation/checkout-bff.controller';
import { CreateCheckoutBffHandler } from './application/commands/handlers/create-checkout-bff.handler';

@Module({
  imports: [CqrsModule],
  controllers: [CheckoutBffController],
  providers: [CreateCheckoutBffHandler],
})
export class CheckoutBffModule {}
