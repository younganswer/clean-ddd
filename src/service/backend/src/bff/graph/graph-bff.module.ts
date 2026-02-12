import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GraphBffController } from './presentation/graph-bff.controller';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [GraphBffController],
  providers: [...QueryHandlers],
})
export class GraphBffModule {}
