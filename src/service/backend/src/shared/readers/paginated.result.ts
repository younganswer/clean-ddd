export interface PaginatedResult<TItem> {
	items: TItem[];
	limit: number;
	offset: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
}
