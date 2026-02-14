import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GraphBffController } from '@/bff/graph/presentation/graph-bff.controller';
import { QueryHandlers } from '@/bff/graph/application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [GraphBffController],
  providers: [...QueryHandlers],
})
export class GraphBffModule {}
