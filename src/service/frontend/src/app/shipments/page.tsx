"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { apiListShipments } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";
import { StatusPill } from "@/app/_components/status-pill";
import { usePaginatedList } from "@/lib/use-paginated-list";

const DEFAULT_PAGE_SIZE = 10;

const ShipmentsPage = () => {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const fetchPage = useCallback(
		(input: { page: number; limit: number }) => apiListShipments(input),
		[],
	);
	const {
		page,
		setPage,
		items: shipments,
		hasNext,
		totalPages,
		error,
	} = usePaginatedList({
		pageSize,
		fetchPage,
	});

	return (
		<div className="page-shell">
			<h1 className="text-2xl font-semibold">배송 목록</h1>

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			<div className="table-shell mt-6">
				<table className="data-table">
					<thead>
						<tr>
							<th>Shipment ID</th>
							<th>Order ID</th>
							<th>Status</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{shipments.map((s) => (
							<tr key={s.shipmentId}>
								<td className="mono-cell">
									<Link
										className="table-link"
										href={`/?rootType=SHIPMENT&rootId=${encodeURIComponent(s.shipmentId)}`}
									>
										{s.shipmentId}
									</Link>
								</td>
								<td className="mono-cell">
									<Link
										className="table-link"
										href={`/?rootType=ORDER&rootId=${encodeURIComponent(s.orderId)}`}
									>
										{s.orderId}
									</Link>
								</td>
								<td>
									<StatusPill status={s.status} />
								</td>
								<td>
									{new Date(s.createdAt).toLocaleString()}
								</td>
							</tr>
						))}
						{shipments.length === 0 && (
							<tr>
								<td className="empty-row" colSpan={4}>
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
		</div>
	);
};
export default ShipmentsPage;
