import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { GraphResponseDto } from '@/bff/graph/presentation/swagger';

import {
	GetGraphBffQuery,
	type GraphView,
} from '@/bff/graph/application/queries/get-graph-bff.query';
import { GetGraphBffQueryDto } from '@/bff/graph/presentation/graph-bff.dto';

@Controller('bff/graph')
export class GraphBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiDataResponse({ model: GraphResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Query() query: GetGraphBffQueryDto,
	): Promise<DataResponse<GraphView>> {
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
				includeEvents: query.includeEvents,
			}),
		);

		if (!result) throw new NotFoundException('graph root not found');
		return DataResponse.of(result);
	}
}
