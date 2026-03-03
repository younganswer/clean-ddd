import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '@/common/responses/base.response';
import type { PaginatedView } from '@/shared/readers/paginated.view';

export class DataResponse<TData> extends BaseResponse<TData> {
	constructor(data: TData) {
		super(true, data);
	}

	static of<TData>(data: TData): DataResponse<TData> {
		return new DataResponse<TData>(data);
	}
}

export class MessageResponse extends DataResponse<string> {
	@ApiProperty({
		description: '메시지 문자열',
		example: 'ok',
	})
	declare readonly data: string;

	constructor(message: string) {
		super(message);
	}

	static from(message: string): MessageResponse {
		return new MessageResponse(message);
	}
}

export class ListResponse<TItem> extends DataResponse<TItem[]> {
	constructor(items: TItem[]) {
		super(items);
	}

	static from<TItem>(items: TItem[]): ListResponse<TItem> {
		return new ListResponse<TItem>(items);
	}
}

export class PageResponse<TItem> extends DataResponse<PaginatedView<TItem>> {
	constructor(page: PaginatedView<TItem>) {
		super(page);
	}

	static from<TItem>(page: PaginatedView<TItem>): PageResponse<TItem> {
		return new PageResponse<TItem>(page);
	}
}
