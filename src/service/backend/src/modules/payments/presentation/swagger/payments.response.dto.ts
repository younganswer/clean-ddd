import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentResponseDto {
	@ApiProperty()
	paymentId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	amount!: number;

	@ApiProperty()
	currency!: string;

	@ApiProperty()
	status!: string;
}

export class ScheduledPaymentEventResponseDto {
	@ApiProperty()
	eventType!: string;

	@ApiProperty()
	delaySeconds!: number;

	@ApiProperty()
	outboxId!: string;
}

export class CreatePaymentIntentResultResponseDto {
	@ApiProperty()
	paymentId!: string;

	@ApiProperty()
	status!: string;

	@ApiProperty({ type: ScheduledPaymentEventResponseDto })
	scheduled!: ScheduledPaymentEventResponseDto;
}
