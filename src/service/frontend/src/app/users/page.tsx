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

	async function load(currentPage: number, currentPageSize: number) {
		setError(null);
		try {
			const res = await apiListUsers({
				limit: currentPageSize,
				page: currentPage,
			});
			setTotalPages(res.totalPages);
			if (currentPage > res.totalPages) {
				setPage(res.totalPages);
				return;
			}
			setUsers(res.items);
			setHasNext(res.hasNext);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}

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
		<>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">사용자</h1>
				<button
					className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-zinc-50"
					onClick={() => void load(page, pageSize)}
				>
					새로고침
				</button>
			</div>

			{error && <div className="mt-4 text-sm text-red-600">{error}</div>}

			<div className="mt-6 overflow-hidden rounded-xl border bg-white">
				<table className="w-full text-left text-sm">
					<thead className="bg-zinc-50 text-xs text-zinc-600">
						<tr>
							<th className="px-4 py-3">SubjectId</th>
							<th className="px-4 py-3">DisplayName</th>
							<th className="px-4 py-3">Email</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.subjectId} className="border-t">
								<td className="px-4 py-3 font-mono text-xs">
									<div className="grid gap-1">
										<Link
											className="underline"
											href={`/graph?rootType=USER&rootId=${encodeURIComponent(u.subjectId)}`}
										>
											{u.subjectId}
										</Link>
									</div>
								</td>
								<td className="px-4 py-3">{u.displayName}</td>
								<td className="px-4 py-3">{u.email}</td>
							</tr>
						))}
						{users.length === 0 && (
							<tr>
								<td
									className="px-4 py-6 text-zinc-500"
									colSpan={3}
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
