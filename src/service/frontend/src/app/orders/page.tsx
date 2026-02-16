"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiListOrders, type OrderSummary } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";

const DEFAULT_PAGE_SIZE = 10;

export default function OrdersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [orders, setOrders] = useState<OrderSummary[]>([]);
	const [hasNextState, setHasNextState] = useState(false);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const hasNext = hasNextState;

	useEffect(() => {
		let active = true;
		void (async () => {
			try {
				const res = await apiListOrders({ limit: pageSize, page });
				if (!active) return;
				setTotalPages(res.totalPages);
				if (page > res.totalPages) {
					setPage(res.totalPages);
					return;
				}
				setOrders(res.items);
				setHasNextState(res.hasNext);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			}
		})();
		return () => {
			active = false;
		};
	}, [page, pageSize]);

	return (
		<div className="page-shell">
			<h1 className="text-2xl font-semibold">주문 목록</h1>

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			<div className="table-shell mt-6">
				<table className="data-table">
					<thead>
						<tr>
							<th>Order ID</th>
							<th>User ID</th>
							<th>Payment ID</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((o) => (
							<tr key={o.orderId}>
								<td className="mono-cell">
									<Link
										className="table-link"
										href={`/?rootType=ORDER&rootId=${encodeURIComponent(o.orderId)}`}
									>
										{o.orderId}
									</Link>
								</td>
								<td className="mono-cell">
									{o.userId ? (
										<Link
											className="table-link"
											href={`/?rootType=USER&rootId=${encodeURIComponent(o.userId)}`}
										>
											{o.userId}
										</Link>
									) : (
										"-"
									)}
								</td>
								<td className="mono-cell">
									{o.paymentId ? (
										<Link
											className="table-link"
											href={`/?rootType=PAYMENT&rootId=${encodeURIComponent(o.paymentId)}`}
										>
											{o.paymentId}
										</Link>
									) : (
										"-"
									)}
								</td>
								<td>
									{new Date(o.createdAt).toLocaleString()}
								</td>
							</tr>
						))}
						{orders.length === 0 && (
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
}
