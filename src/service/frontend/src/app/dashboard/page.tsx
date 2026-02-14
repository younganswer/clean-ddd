"use client";

import Link from "next/link";
import { useState } from "react";
import { apiCreateOrder } from "@/lib/api";

const toCurrency = (value: string): "KRW" | "USD" => {
	return value === "USD" ? "USD" : "KRW";
};

export default function DashboardPage() {
	const [userId, setUserId] = useState("");
	const [amount, setAmount] = useState("1000");
	const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");
	const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	return (
		<>
			<h1 className="text-2xl font-semibold">대시보드</h1>
			<p className="mt-2 text-sm text-zinc-600">
				백엔드 데이터 구조 확인용 최소 어드민입니다.
			</p>

			<section className="mt-8 rounded-xl border bg-white p-6">
				<h2 className="text-lg font-semibold">주문 생성</h2>
				<div className="mt-4 grid gap-3 sm:grid-cols-4">
					<label className="grid gap-1">
						<span className="text-xs text-zinc-600">
							UserId (uuid)
						</span>
						<input
							className="h-10 rounded-md border px-3 font-mono text-xs"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="00000000-0000-0000-0000-000000000001"
						/>
					</label>
					<label className="grid gap-1">
						<span className="text-xs text-zinc-600">금액</span>
						<input
							className="h-10 rounded-md border px-3"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							inputMode="numeric"
						/>
					</label>
					<label className="grid gap-1">
						<span className="text-xs text-zinc-600">통화</span>
						<select
							className="h-10 rounded-md border px-3"
							value={currency}
							onChange={(e) =>
								setCurrency(toCurrency(e.target.value))
							}
						>
							<option value="KRW">KRW</option>
							<option value="USD">USD</option>
						</select>
					</label>
					<div className="grid gap-1">
						<span className="text-xs text-zinc-600">액션</span>
						<button
							className="h-10 rounded-md bg-zinc-900 px-3 text-white hover:bg-zinc-800"
							onClick={async () => {
								setError(null);
								setCreatedOrderId(null);
								try {
									const res = await apiCreateOrder({
										userId,
										amount: Number(amount),
										currency,
									});
									setCreatedOrderId(res.orderId);
								} catch (error: unknown) {
									setError(
										error instanceof Error
											? error.message
											: String(error),
									);
								}
							}}
						>
							생성
						</button>
					</div>
				</div>

				{createdOrderId && (
					<div className="mt-4 rounded-md border bg-zinc-50 p-3 text-sm">
						생성됨:{" "}
						<Link
							className="underline"
							href={`/orders/detail/?id=${encodeURIComponent(createdOrderId)}`}
						>
							{createdOrderId}
						</Link>
					</div>
				)}
				{error && (
					<div className="mt-4 text-sm text-red-600">{error}</div>
				)}
			</section>
		</>
	);
}
