import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentRequest {
	@IsOptional()
	@IsIn(['SUCCEEDED', 'FAILED'])
	simulateOutcome?: 'SUCCEEDED' | 'FAILED';

	@IsOptional()
	@IsString()
	simulateDelaySeconds?: string;
}
