import { ApiProperty } from '@nestjs/swagger';
import { BaseEnvelope } from '@/common/responses/base.response';
import type { PaginatedResult } from '@/common/types/paginated.result';

export class DataEnvelope<TData> extends BaseEnvelope<TData> {
	constructor(data: TData) {
		super(true, data);
	}

	static of<TData>(data: TData): DataEnvelope<TData> {
		return new DataEnvelope<TData>(data);
	}
}

export class MessageEnvelope extends DataEnvelope<string> {
	@ApiProperty({
		description: '메시지 문자열',
		example: 'ok',
	})
	declare readonly data: string;

	constructor(message: string) {
		super(message);
	}

	static from(message: string): MessageEnvelope {
		return new MessageEnvelope(message);
	}
}

export class ListEnvelope<TItem> extends DataEnvelope<TItem[]> {
	constructor(items: TItem[]) {
		super(items);
	}

	static from<TItem>(items: TItem[]): ListEnvelope<TItem> {
		return new ListEnvelope<TItem>(items);
	}
}

export class PageEnvelope<TItem> extends DataEnvelope<PaginatedResult<TItem>> {
	constructor(page: PaginatedResult<TItem>) {
		super(page);
	}

	static from<TItem>(page: PaginatedResult<TItem>): PageEnvelope<TItem> {
		return new PageEnvelope<TItem>(page);
	}
}
