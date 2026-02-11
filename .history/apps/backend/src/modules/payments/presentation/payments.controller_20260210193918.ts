import {
  Body,
  Controller,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  CreatePaymentIntentCommand,
  type CreatePaymentIntentResult,
} from '../../../shared/payments';
import { CreatePaymentIntentRequest } from './dto/create-payment-intent.request';

function isHttpExceptionLike(error: unknown): error is { getStatus(): number } {
  return (
    !!error &&
    typeof error === 'object' &&
    'getStatus' in error &&
    typeof (error as Record<string, unknown>).getStatus === 'function'
  );
}

@Controller('orders/:orderId/payments')
export class PaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('intents')
  async createIntent(
    @Param('orderId') orderId: string,
    @Body() body: CreatePaymentIntentRequest,
  ): Promise<CreatePaymentIntentResult> {
    try {
      return await this.commandBus.execute(
        new CreatePaymentIntentCommand({
          orderId,
          simulateOutcome: body.simulateOutcome,
          simulateDelaySeconds:
            body.simulateDelaySeconds !== undefined
              ? Number(body.simulateDelaySeconds)
              : undefined,
        }),
      );
    } catch (error) {
      console.error('[PaymentsController.createIntent] failed', error);

      if (isHttpExceptionLike(error)) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'development') {
        throw new InternalServerErrorException(message);
      }
      throw new InternalServerErrorException();
    }
  }
}
