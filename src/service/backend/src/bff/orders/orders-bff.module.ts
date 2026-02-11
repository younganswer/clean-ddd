import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffController } from './presentation/orders-bff.controller';
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [OrdersBffController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class OrdersBffModule {}
