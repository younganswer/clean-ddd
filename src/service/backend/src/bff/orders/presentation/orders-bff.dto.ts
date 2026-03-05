import { Type } from 'class-transformer';
import {
	IsArray,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	Min,
	ValidateNested,
} from 'class-validator';

export class BffOrderItemDto {
	@IsString()
	@IsNotEmpty()
	sku!: string;

	@IsInt()
	@Min(1)
	quantity!: number;
}

export class CreateOrderBffBodyDto {
	@IsUUID()
	@IsNotEmpty()
	userId!: string;

	@IsNumber()
	@IsPositive()
	amount!: number;

	@IsString()
	@IsNotEmpty()
	currency!: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => BffOrderItemDto)
	items?: BffOrderItemDto[];
}
