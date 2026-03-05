export interface PaginatedResult<TItem> {
	items: TItem[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
}
