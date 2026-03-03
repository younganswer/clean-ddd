import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '@/common/responses/base.response';

export class ErrorData {
	@ApiProperty({
		description: '문제 유형 식별자 URI',
		example: 'about:blank#NOT_FOUND',
	})
	type!: string;

	@ApiProperty({
		description: 'HTTP 상태 텍스트',
		example: 'NOT_FOUND',
	})
	title!: string;

	@ApiProperty({
		description: 'HTTP 상태 코드',
		example: 404,
	})
	status!: number;

	@ApiProperty({
		description: '오류 상세 설명',
		example: 'resource not found',
	})
	detail!: string;

	@ApiProperty({
		description: '요청 경로',
		example: '/orders/unknown',
	})
	instance!: string;

	@ApiProperty({
		description: '애플리케이션 오류 코드',
		example: 'ORDER_NOT_FOUND',
	})
	code!: string;

	@ApiProperty({
		description: '추적 ID',
		example: 'a1b2c3d4',
	})
	traceId!: string;

	@ApiProperty({
		description: '오류 발생 시각(ISO8601)',
		example: '2026-03-01T00:00:00.000Z',
	})
	timestamp!: string;

	@ApiProperty({
		description: '검증 오류 등 부가 오류 정보',
		required: false,
		nullable: true,
		type: Object,
	})
	errors?: unknown;
}

export class ErrorResponse extends BaseResponse<ErrorData> {
	@ApiProperty({
		description: '요청 처리 성공 여부',
		example: false,
	})
	declare readonly success: false;

	@ApiProperty({ type: ErrorData })
	declare readonly data: ErrorData;

	constructor(data: ErrorData) {
		super(false, data);
	}

	static from(data: ErrorData): ErrorResponse {
		return new ErrorResponse(data);
	}
}
