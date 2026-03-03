import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseResponse<TData> {
	@ApiProperty({
		description: '요청 처리 성공 여부',
		example: true,
	})
	readonly success: boolean;

	@ApiProperty({
		description: '응답 데이터 본문',
		required: false,
		nullable: true,
		type: Object,
	})
	readonly data: TData;

	protected constructor(success: boolean, data: TData) {
		this.success = success;
		this.data = data;
	}
}
