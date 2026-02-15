"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
	apiCreatePaymentIntent,
	apiGetOrder,
	apiGetShipmentByOrderId,
	apiListInventoryReservations,
	type OrderDetail,
	type ShipmentSummary,
} from "@/lib/api";
import { StatusPill } from "@/app/_components/status-pill";

const toOutcome = (value: string): "SUCCEEDED" | "FAILED" => {
	return value === "FAILED" ? "FAILED" : "SUCCEEDED";
};

export default function OrderDetailPage() {
	return (
		<Suspense
			fallback={
				<div className="text-sm text-muted-foreground">로딩 중…</div>
			}
		>
			<OrderDetailInner />
		</Suspense>
	);
}

function OrderDetailInner() {
	const search = useSearchParams();
	const orderId = search.get("id") ?? "";

	const [order, setOrder] = useState<OrderDetail | null>(null);
	const [shipment, setShipment] = useState<ShipmentSummary | null>(null);
	const [reservationCount, setReservationCount] = useState<number | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [outcome, setOutcome] = useState<"SUCCEEDED" | "FAILED">("SUCCEEDED");

	const loadOrderDetail = useCallback(async () => {
		if (!orderId) return;
		const [data, ship, reservations] = await Promise.all([
			apiGetOrder(orderId),
			apiGetShipmentByOrderId(orderId),
			apiListInventoryReservations(orderId),
		]);
		return {
			order: data,
			shipment: ship,
			reservationCount: Array.isArray(reservations)
				? reservations.length
				: null,
		};
	}, [orderId]);

	const refresh = useCallback(async () => {
		if (!orderId) return;
		setError(null);
		try {
			const loaded = await loadOrderDetail();
			if (!loaded) return;
			setOrder(loaded.order);
			setShipment(loaded.shipment);
			setReservationCount(loaded.reservationCount);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}, [loadOrderDetail, orderId]);

	useEffect(() => {
		if (!orderId) return;
		let active = true;
		void (async () => {
			setError(null);
			try {
				const loaded = await loadOrderDetail();
				if (!active) return;
				if (!loaded) return;
				setOrder(loaded.order);
				setShipment(loaded.shipment);
				setReservationCount(loaded.reservationCount);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			}
		})();
		return () => {
			active = false;
		};
	}, [loadOrderDetail, orderId]);

	return (
		<div className="page-shell">
			<div className="flex items-center justify-between">
				<div className="grid gap-1">
					{orderId ? (
						<h1 className="text-2xl font-semibold">
							<Link
								className="underline"
								href={`/?rootType=ORDER&rootId=${encodeURIComponent(orderId)}`}
							>
								{orderId}
							</Link>
						</h1>
					) : (
						<h1 className="text-2xl font-semibold">(id 없음)</h1>
					)}
				</div>

				<div className="flex items-center gap-2">
					<button
						className="btn h-9"
						disabled={!orderId}
						onClick={() => void refresh()}
					>
						새로고침
					</button>
				</div>
			</div>

			{!orderId && (
				<div className="surface mt-6 p-6 text-sm text-muted-foreground">
					쿼리 파라미터로{" "}
					<code className="rounded bg-surface-muted px-1">
						?id=...
					</code>{" "}
					를 전달해 주세요.
				</div>
			)}

			{error && <div className="mt-4 text-sm text-danger">{error}</div>}

			{order && (
				<div className="mt-6 grid gap-6">
					<section className="surface p-6">
						<h2 className="text-lg font-semibold">주문 정보</h2>
						<dl className="mt-4 grid gap-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									UserId
								</dt>
								<dd>
									{order.userId ? (
										<Link
											className="font-mono text-xs underline"
											href={`/?rootType=USER&rootId=${encodeURIComponent(order.userId)}`}
										>
											{order.userId}
										</Link>
									) : (
										"-"
									)}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									Status
								</dt>
								<dd>
									<StatusPill status={order.status} />
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									Amount
								</dt>
								<dd>
									{order.amount} {order.currency}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Items</dt>
								<dd className="text-right">
									{(order.items ?? []).map((it, idx) => (
										<div key={idx}>
											{it.sku} × {it.quantity}
										</div>
									))}
									{(order.items ?? []).length === 0 && "-"}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									PaymentId
								</dt>
								<dd>
									{order.paymentId ? (
										<Link
											className="font-mono text-xs underline"
											href={`/?rootType=PAYMENT&rootId=${encodeURIComponent(order.paymentId)}`}
										>
											{order.paymentId}
										</Link>
									) : (
										"-"
									)}
								</dd>
							</div>
						</dl>
					</section>

					<section className="surface p-6">
						<h2 className="text-lg font-semibold">컨텍스트 상태</h2>
						<dl className="mt-4 grid gap-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									배송(Shipment)
								</dt>
								<dd>
									{shipment ? (
										<span className="flex flex-wrap items-center justify-end gap-2">
											<StatusPill
												status={shipment.status}
											/>
											<Link
												className="font-mono text-xs underline"
												href={`/?rootType=SHIPMENT&rootId=${encodeURIComponent(shipment.shipmentId)}`}
											>
												{shipment.shipmentId}
											</Link>
										</span>
									) : (
										"-"
									)}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">
									재고 예약
								</dt>
								<dd>
									{reservationCount === null
										? "-"
										: `${reservationCount}건`}
								</dd>
							</div>
						</dl>
						<p className="mt-2 text-xs text-muted-foreground">
							결제 성공 이벤트가 처리되면 자동으로 채워집니다.
						</p>
					</section>

					<section className="surface p-6">
						<h2 className="text-lg font-semibold">
							결제 인텐트 생성(시뮬레이터)
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							생성 즉시 PENDING으로 저장되고, SQS를 통해 웹훅
							이벤트가 비동기 전달됩니다.
						</p>

						<div className="mt-4 flex flex-wrap items-end gap-3">
							<label className="grid gap-1">
								<span className="field-label">결과</span>
								<select
									className="input"
									value={outcome}
									onChange={(e) =>
										setOutcome(toOutcome(e.target.value))
									}
								>
									<option value="SUCCEEDED">SUCCEEDED</option>
									<option value="FAILED">FAILED</option>
								</select>
							</label>

							<button
								className="btn btn-primary h-10"
								onClick={async () => {
									setError(null);
									try {
										await apiCreatePaymentIntent(orderId, {
											simulateOutcome: outcome,
										});
										await refresh();
									} catch (e: unknown) {
										const message =
											e instanceof Error
												? e.message
												: String(e);
										setError(message);
									}
								}}
							>
								결제 인텐트 생성
							</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
