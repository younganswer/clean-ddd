"use client";

import { useEffect, useState } from "react";
import type { Paginated } from "@/lib/api";

type PaginatedListOptions<TItem> = {
	pageSize: number;
	fetchPage: (input: {
		page: number;
		limit: number;
	}) => Promise<Paginated<TItem>>;
};

export const usePaginatedList = <TItem>(
	options: PaginatedListOptions<TItem>,
) => {
	const { pageSize, fetchPage } = options;
	const [page, setPage] = useState(1);
	const [items, setItems] = useState<TItem[]>([]);
	const [hasNext, setHasNext] = useState(false);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		void (async () => {
			setError(null);
			try {
				const res = await fetchPage({ limit: pageSize, page });
				if (!active) return;
				setTotalPages(res.totalPages);
				if (page > res.totalPages) {
					setPage(res.totalPages);
					return;
				}
				setItems(res.items);
				setHasNext(res.hasNext);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			}
		})();

		return () => {
			active = false;
		};
	}, [fetchPage, page, pageSize]);

	return {
		page,
		setPage,
		items,
		hasNext,
		totalPages,
		error,
	};
};
