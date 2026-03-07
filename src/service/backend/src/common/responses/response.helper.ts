import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	DataEnvelope,
	ListEnvelope,
	MessageEnvelope,
	PageEnvelope,
} from '@/common/responses/success.response';
import {
	ErrorEnvelope,
	ErrorResponse,
} from '@/common/responses/error.response';

export class ResponseHelper {
	static data<TData>(data: TData): DataEnvelope<TData> {
		return DataEnvelope.of(data);
	}

	static list<TItem>(items: TItem[]): ListEnvelope<TItem> {
		return ListEnvelope.from(items);
	}

	static page<TItem>(page: PaginatedResult<TItem>): PageEnvelope<TItem> {
		return PageEnvelope.from(page);
	}

	static message(message: string): MessageEnvelope {
		return MessageEnvelope.from(message);
	}

	static error(data: ErrorResponse): ErrorEnvelope {
		return ErrorEnvelope.from(data);
	}
}
