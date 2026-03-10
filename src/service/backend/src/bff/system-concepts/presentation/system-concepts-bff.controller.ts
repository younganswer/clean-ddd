import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { SystemConceptsBootstrapResponse } from '@/bff/system-concepts/presentation/swagger/system-concepts.response';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';
import { GetSystemConceptsBootstrapBffQuery } from '@/bff/system-concepts/application/queries';

@Controller('bff/system-concepts')
export class SystemConceptsBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('bootstrap')
	@ApiDataResponse({ model: SystemConceptsBootstrapResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async bootstrap(
		@Query() query: PageQueryDto,
	): Promise<DataEnvelope<SystemConceptsBootstrapResponse>> {
		const result = await this.queryBus.execute(
			new GetSystemConceptsBootstrapBffQuery({
				limit: query.limit,
				offset: query.offset,
			}),
		);
		const response = SystemConceptsBootstrapResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
