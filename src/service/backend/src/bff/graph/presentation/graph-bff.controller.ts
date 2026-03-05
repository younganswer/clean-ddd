import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { GraphResponse } from '@/bff/graph/presentation/swagger';

import {
	GetGraphBffQuery,
	type GraphView,
} from '@/bff/graph/application/queries/get-graph-bff.query';
import { GetGraphBffQueryDto } from '@/bff/graph/presentation/graph-bff.dto';

@Controller('bff/graph')
export class GraphBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiDataResponse({ model: GraphResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Query() query: GetGraphBffQueryDto,
	): Promise<DataEnvelope<GraphResponse>> {
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
		return ResponseHelper.data(GraphResponse.fromResult(result));
	}
}
