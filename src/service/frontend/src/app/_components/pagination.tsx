"use client";

type Props = {
	page: number;
	pageSize: number;
	totalPages: number;
	hasNext: boolean;
	onPageSizeChange: (pageSize: number) => void;
	onPrev: () => void;
	onNext: () => void;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export function Pagination({
	page,
	pageSize,
	totalPages,
	hasNext,
	onPageSizeChange,
	onPrev,
	onNext,
}: Props) {
	return (
		<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
				<label className="flex items-center gap-2">
					<span>페이지 크기</span>
					<select
						className="input h-9 w-[72px] px-2 text-sm font-medium"
						value={pageSize}
						onChange={(e) =>
							onPageSizeChange(Number(e.target.value))
						}
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
				</label>
				<span>
					페이지 {page} / {totalPages}
				</span>
			</div>
			<div className="flex gap-2">
				<button
					className="btn h-9"
					disabled={page <= 1}
					onClick={onPrev}
				>
					이전
				</button>
				<button
					className="btn h-9"
					disabled={!hasNext || page >= totalPages}
					onClick={onNext}
				>
					다음
				</button>
			</div>
		</div>
	);
}
