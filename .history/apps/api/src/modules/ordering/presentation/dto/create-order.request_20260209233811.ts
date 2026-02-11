import { IsIn, IsInt, Min } from 'class-validator';

export class CreateOrderRequest {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsIn(['KRW', 'USD'])
  currency!: string;
}
