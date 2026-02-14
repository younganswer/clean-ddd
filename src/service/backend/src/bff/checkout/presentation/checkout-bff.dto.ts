import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class CheckoutOrderItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateCheckoutBffBodyDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutOrderItemDto)
  items?: CheckoutOrderItemDto[];

  @IsOptional()
  @IsIn(['SUCCEEDED', 'FAILED'])
  simulateOutcome?: 'SUCCEEDED' | 'FAILED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  simulateDelaySeconds?: number;
}
