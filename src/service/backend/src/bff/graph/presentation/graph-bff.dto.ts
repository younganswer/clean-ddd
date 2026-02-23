import {
	IsBooleanString,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class GetGraphBffQueryDto {
	@IsIn(['USER', 'ORDER', 'SHIPMENT', 'PAYMENT'])
	rootType!: 'USER' | 'ORDER' | 'SHIPMENT' | 'PAYMENT';

	@IsString()
	rootId!: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(4)
	depth?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(2000)
	maxEvents?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(2000)
	maxNodes?: number;

	@IsOptional()
	@IsBooleanString()
	includeEvents?: string;
}
