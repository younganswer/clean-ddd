"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiListUsers, type UserProfile } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";

const DEFAULT_PAGE_SIZE = 10;

export default function UsersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [hasNext, setHasNext] = useState(false);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		void (async () => {
			try {
				const res = await apiListUsers({ limit: pageSize, page });
				if (!active) return;
				setTotalPages(res.totalPages);
				if (page > res.totalPages) {
					setPage(res.totalPages);
					return;
				}
				setUsers(res.items);
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
	}, [page, pageSize]);

	return (
		<div className="page-shell">
			<h1 className="text-2xl font-semibold">사용자</h1>

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			<div className="table-shell mt-6">
				<table className="data-table">
					<thead>
						<tr>
							<th>Display Name</th>
							<th>Email</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.userId}>
								<td>
									<Link
										className="table-link"
										href={`/?rootType=USER&rootId=${encodeURIComponent(u.userId)}`}
									>
										{u.displayName}
									</Link>
								</td>
								<td>
									<Link
										className="table-link"
										href={`/?rootType=USER&rootId=${encodeURIComponent(u.userId)}`}
									>
										{u.email}
									</Link>
								</td>
							</tr>
						))}
						{users.length === 0 && (
							<tr>
								<td className="empty-row" colSpan={2}>
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
