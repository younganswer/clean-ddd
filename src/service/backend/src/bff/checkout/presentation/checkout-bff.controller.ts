import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CreateCheckoutBffBodyDto } from './checkout-bff.dto';
import {
  CreateCheckoutBffCommand,
  type CreateCheckoutBffResult,
} from '../application/commands/create-checkout-bff.command';

@Controller('bff/checkout')
export class CheckoutBffController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @Body() body: CreateCheckoutBffBodyDto,
  ): Promise<CreateCheckoutBffResult> {
    return await this.commandBus.execute<
      CreateCheckoutBffCommand,
      CreateCheckoutBffResult
    >(new CreateCheckoutBffCommand({ body }));
  }
}
