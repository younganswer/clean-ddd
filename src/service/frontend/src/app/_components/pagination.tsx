"use client";

type Props = {
	page: number;
	pageSize: number;
	totalPages: number;
	hasNext: boolean;
	className?: string;
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
	className,
	onPageSizeChange,
	onPrev,
	onNext,
}: Props) {
	return (
		<div
			className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
		>
			<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
				<label className="flex items-center gap-2">
					<span>페이지 크기</span>
					<select
						className="input h-9 w-16 px-2 text-sm font-medium"
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
			<div className="flex w-full gap-2 sm:w-auto">
				<button
					className="btn h-9 flex-1 sm:flex-none"
					disabled={page <= 1}
					onClick={onPrev}
				>
					이전
				</button>
				<button
					className="btn h-9 flex-1 sm:flex-none"
					disabled={!hasNext || page >= totalPages}
					onClick={onNext}
				>
					다음
				</button>
			</div>
		</div>
	);
}
