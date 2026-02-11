import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemRequest {
  @IsString()
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderRequest {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsIn(['KRW', 'USD'])
  currency!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemRequest)
  items?: CreateOrderItemRequest[];
}
