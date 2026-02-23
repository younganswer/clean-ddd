import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
	GetGraphBffQuery,
	type GraphView,
} from '@/bff/graph/application/queries/get-graph-bff.query';
import { GetGraphBffQueryDto } from '@/bff/graph/presentation/graph-bff.dto';

@Controller('bff/graph')
export class GraphBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	async get(@Query() query: GetGraphBffQueryDto): Promise<GraphView> {
		const result = await this.queryBus.execute<
			GetGraphBffQuery,
			GraphView | null
		>(
			new GetGraphBffQuery({
				rootType: query.rootType,
				rootId: query.rootId,
				depth: query.depth,
				maxEvents: query.maxEvents,
				maxNodes: query.maxNodes,
				includeEvents:
					typeof query.includeEvents === 'string'
						? query.includeEvents === 'true'
						: undefined,
			}),
		);

		if (!result) throw new NotFoundException('graph root not found');
		return result;
	}
}
