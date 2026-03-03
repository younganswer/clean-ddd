import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { CreateCheckoutBffResultResponseDto } from '@/bff/checkout/presentation/swagger';

import { CreateCheckoutBffBodyDto } from '@/bff/checkout/presentation/checkout-bff.dto';
import {
	CreateCheckoutBffCommand,
	type CreateCheckoutBffResult,
} from '@/bff/checkout/application/commands/create-checkout-bff.command';

@Controller('bff/checkout')
export class CheckoutBffController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post()
	@ApiDataResponse(
		{ model: CreateCheckoutBffResultResponseDto },
		{ status: 201 },
	)
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateCheckoutBffBodyDto,
	): Promise<DataResponse<CreateCheckoutBffResult>> {
		const result = await this.commandBus.execute<
			CreateCheckoutBffCommand,
			CreateCheckoutBffResult
		>(new CreateCheckoutBffCommand({ body }));
		return DataResponse.of(result);
	}
}
