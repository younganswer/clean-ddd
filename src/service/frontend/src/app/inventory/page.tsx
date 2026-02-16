"use client";

import { useCallback, useState } from "react";
import { apiListInventoryItems } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";
import { usePaginatedList } from "@/lib/use-paginated-list";

const DEFAULT_PAGE_SIZE = 10;

export default function InventoryPage() {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const fetchPage = useCallback(
		(input: { page: number; limit: number }) =>
			apiListInventoryItems(input),
		[],
	);
	const { page, setPage, items, hasNext, totalPages, error } =
		usePaginatedList({
			pageSize,
			fetchPage,
		});

	return (
		<div className="page-shell">
			<h1 className="text-2xl font-semibold">재고</h1>

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			<div className="table-shell mt-6">
				<table className="data-table">
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
								<td className="mono-cell">{i.itemId}</td>
								<td className="mono-cell">{i.sku}</td>
								<td className="mono-cell">
									{i.price.currency} {i.price.amountMinor}
								</td>
								<td>{i.availableQuantity}</td>
								<td>{i.reservedQuantity}</td>
								<td>
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
