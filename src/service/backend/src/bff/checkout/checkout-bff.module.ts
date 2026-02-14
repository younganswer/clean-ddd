import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CheckoutBffController } from '@/bff/checkout/presentation/checkout-bff.controller';
import { CommandHandlers } from '@/bff/checkout/application/commands';

@Module({
  imports: [CqrsModule],
  controllers: [CheckoutBffController],
  providers: [...CommandHandlers],
})
export class CheckoutBffModule {}
