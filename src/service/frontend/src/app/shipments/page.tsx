"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiListShipments, type ShipmentSummary } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";

const DEFAULT_PAGE_SIZE = 10;

export default function ShipmentsPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
	const [hasNextState, setHasNextState] = useState(false);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const hasNext = hasNextState;

	async function refresh() {
		setError(null);
		try {
			const res = await apiListShipments({ limit: pageSize, page });
			setTotalPages(res.totalPages);
			if (page > res.totalPages) {
				setPage(res.totalPages);
				return;
			}
			setShipments(res.items);
			setHasNextState(res.hasNext);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}

	useEffect(() => {
		let active = true;
		void (async () => {
			try {
				const res = await apiListShipments({ limit: pageSize, page });
				if (!active) return;
				setTotalPages(res.totalPages);
				if (page > res.totalPages) {
					setPage(res.totalPages);
					return;
				}
				setShipments(res.items);
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
		<>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">배송 목록</h1>
				<button
					className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-zinc-50"
					onClick={() => void refresh()}
				>
					새로고침
				</button>
			</div>

			{error && <div className="mt-4 text-sm text-red-600">{error}</div>}

			<div className="mt-6 overflow-hidden rounded-xl border bg-white">
				<table className="w-full text-left text-sm">
					<thead className="bg-zinc-50 text-xs text-zinc-600">
						<tr>
							<th className="px-4 py-3">ShipmentId</th>
							<th className="px-4 py-3">OrderId</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Created</th>
						</tr>
					</thead>
					<tbody>
						{shipments.map((s) => (
							<tr key={s.shipmentId} className="border-t">
								<td className="px-4 py-3 font-mono text-xs">
									<Link
										className="underline"
										href={`/graph?rootType=SHIPMENT&rootId=${encodeURIComponent(s.shipmentId)}`}
									>
										{s.shipmentId}
									</Link>
								</td>
								<td className="px-4 py-3">
									<div className="grid gap-1">
										<Link
											className="underline"
											href={`/orders/detail/?id=${encodeURIComponent(s.orderId)}`}
										>
											{s.orderId}
										</Link>
										<Link
											className="text-xs text-zinc-600 underline"
											href={`/graph?rootType=ORDER&rootId=${encodeURIComponent(s.orderId)}`}
										>
											그래프 보기
										</Link>
									</div>
								</td>
								<td className="px-4 py-3">{s.status}</td>
								<td className="px-4 py-3">
									{new Date(s.createdAt).toLocaleString()}
								</td>
							</tr>
						))}
						{shipments.length === 0 && (
							<tr>
								<td
									className="px-4 py-6 text-zinc-500"
									colSpan={4}
								>
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
		</>
	);
}
