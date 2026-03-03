import { ApiProperty } from '@nestjs/swagger';
import { CreatePaymentIntentResultResponseDto } from '@/modules/payments/presentation/swagger';

export class CreateCheckoutBffResultResponseDto {
	@ApiProperty()
	orderId!: string;

	@ApiProperty({ type: CreatePaymentIntentResultResponseDto })
	payment!: CreatePaymentIntentResultResponseDto;
}
