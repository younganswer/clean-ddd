"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { apiListUsers, type UserProfile } from "@/lib/api";
import { Pagination } from "@/app/_components/pagination";
import { usePaginatedList } from "@/lib/use-paginated-list";

const DEFAULT_PAGE_SIZE = 10;

export default function UsersPage() {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const fetchUsers = useCallback(
		({ page, limit }: { page: number; limit: number }) => {
			return apiListUsers({ limit, page });
		},
		[],
	);
	const {
		page,
		setPage,
		items: users,
		hasNext,
		totalPages,
		error,
	} = usePaginatedList<UserProfile>({
		pageSize,
		fetchPage: fetchUsers,
	});

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
