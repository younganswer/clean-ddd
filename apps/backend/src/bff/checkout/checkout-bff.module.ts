import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CheckoutBffController } from './presentation/checkout-bff.controller';
import { CommandHandlers } from './application/commands';

@Module({
  imports: [CqrsModule],
  controllers: [CheckoutBffController],
  providers: [...CommandHandlers],
})
export class CheckoutBffModule {}
