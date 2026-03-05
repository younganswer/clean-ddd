import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { GraphResponse } from '@/bff/graph/presentation/swagger';

import { GetGraphBffQuery } from '@/bff/graph/application/queries/get-graph-bff.query';
import { GetGraphBffQueryDto } from '@/bff/graph/presentation/graph-bff.dto';
import { SYSTEM_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

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
			throw ApplicationErrorFactory.create(
				SYSTEM_APPLICATION_ERRORS.GRAPH_ROOT_NOT_FOUND,
			);
		const response = GraphResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
