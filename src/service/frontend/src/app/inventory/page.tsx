"use client";

import { useCallback, useState } from "react";
import { apiListInventoryItems, type InventoryItem } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";
import { usePaginatedList } from "@/lib/use-paginated-list";

const DEFAULT_PAGE_SIZE = 10;

export default function InventoryPage() {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const fetchInventoryItems = useCallback(
		({ page, limit }: { page: number; limit: number }) => {
			return apiListInventoryItems({ limit, page });
		},
		[],
	);
	const { page, setPage, items, hasNext, totalPages, error } =
		usePaginatedList<InventoryItem>({
			pageSize,
			fetchPage: fetchInventoryItems,
		});

	return (
		<div className="page-shell">
			<h1 className="text-2xl font-semibold">재고</h1>

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			<div className="table-shell table-shell-readable mt-6">
				<table className="data-table data-table-mobile-cards">
					<thead>
						<tr>
							<th>Item ID</th>
							<th>SKU</th>
							<th>Price</th>
							<th>Available</th>
							<th>Reserved</th>
							<th>Updated</th>
						</tr>
					</thead>
					<tbody>
						{items.map((i) => (
							<tr key={i.itemId}>
								<td data-label="Item ID" className="mono-cell">
									{i.itemId}
								</td>
								<td data-label="SKU" className="mono-cell">
									{i.sku}
								</td>
								<td data-label="Price" className="mono-cell">
									{i.price.currency} {i.price.amountMinor}
								</td>
								<td data-label="Available">
									{i.availableQuantity}
								</td>
								<td data-label="Reserved">
									{i.reservedQuantity}
								</td>
								<td data-label="Updated">
									{new Date(i.updatedAt).toLocaleString()}
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td className="empty-row" colSpan={6}>
									데이터 없음
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<Pagination
				className="table-shell-readable"
				page={page}
				pageSize={pageSize}
				totalPages={totalPages}
				hasNext={hasNext}
				onPageSizeChange={(next) => setPageSize(next)}
				onPrev={() => setPage((p) => Math.max(1, p - 1))}
				onNext={() => setPage((p) => p + 1)}
			/>

			<p className="mt-3 text-xs text-muted-foreground">
				기본 시드: SKU-001 (available=100). 결제 성공 시 주문 items만큼
				reserved로 이동합니다.
			</p>
		</div>
	);
}
