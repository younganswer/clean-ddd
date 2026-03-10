import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { CreateCheckoutBffResponse } from '@/bff/checkout/presentation/swagger/checkout.response';

import { CreateCheckoutBffBodyDto } from '@/bff/checkout/presentation/checkout-bff.dto';
import { CreateCheckoutBffCommand } from '@/bff/checkout/application/commands/create-checkout-bff.command';

@Controller('bff/checkout')
export class CheckoutBffController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post()
	@ApiDataResponse({ model: CreateCheckoutBffResponse }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateCheckoutBffBodyDto,
	): Promise<DataEnvelope<CreateCheckoutBffResponse>> {
		const result = await this.commandBus.execute(
			new CreateCheckoutBffCommand(body),
		);
		const response = CreateCheckoutBffResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
