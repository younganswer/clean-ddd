import { ApiProperty } from '@nestjs/swagger';
import { InventoryItemResponseDto } from '@/modules/inventory/presentation/swagger';
import { UserProfileResponseDto } from '@/modules/users/presentation/swagger';

export class PaginatedUserProfileResponseDto {
	@ApiProperty({ type: [UserProfileResponseDto] })
	items!: UserProfileResponseDto[];

	@ApiProperty()
	page!: number;

	@ApiProperty()
	limit!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	totalPages!: number;

	@ApiProperty()
	hasNext!: boolean;
}

export class PaginatedInventoryItemResponseDto {
	@ApiProperty({ type: [InventoryItemResponseDto] })
	items!: InventoryItemResponseDto[];

	@ApiProperty()
	page!: number;

	@ApiProperty()
	limit!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	totalPages!: number;

	@ApiProperty()
	hasNext!: boolean;
}

export class SystemConceptsBootstrapResponseDto {
	@ApiProperty({ type: PaginatedUserProfileResponseDto })
	users!: PaginatedUserProfileResponseDto;

	@ApiProperty({ type: PaginatedInventoryItemResponseDto })
	inventoryItems!: PaginatedInventoryItemResponseDto;
}
