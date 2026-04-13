import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { GraphResponse } from '@/bff/graph/presentation/swagger/graph.response';

import { GetGraphBffQuery } from '@/bff/graph/application/queries/get-graph-bff.query';
import { GetGraphBffQueryDto } from '@/bff/graph/presentation/graph-bff.dto';
import { SystemGraphRootNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

@Controller('bff/graph')
export class GraphBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiDataResponse({ model: GraphResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Query() query: GetGraphBffQueryDto,
	): Promise<DataEnvelope<GraphResponse>> {
		const result = await this.queryBus.execute(new GetGraphBffQuery(query));
		if (!result)
			throw ApplicationExceptionFactory.create(
				SystemGraphRootNotFoundException,
			);
		const response = GraphResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
