"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	apiCreateOrder,
	apiCreatePaymentIntent,
	apiGetOrder,
	apiListInventoryItems,
	apiListUsers,
	apiGetPaymentIntent,
	apiGetShipmentByOrderId,
	type InventoryItem,
	type OrderDetail,
	type PaymentIntent,
	type ShipmentSummary,
	type UserProfile,
} from "@/lib/api";
import { StatusPill } from "@/app/_components/status-pill";

type Layer = "presentation" | "application" | "domain" | "infrastructure";
type StepStatus =
	| "idle"
	| "pending"
	| "running"
	| "succeeded"
	| "failed"
	| "skipped";
type RunPhase =
	| "idle"
	| "starting-order"
	| "order-ready"
	| "starting-payment"
	| "awaiting-payment"
	| "awaiting-shipment"
	| "completed"
	| "failed"
	| "timeout";

type StepDef = {
	id: string;
	order: number;
	label: string;
	layer: Layer;
	method: string;
	description: string;
	flow: {
		from: Layer;
		to: Layer;
		payload: string[];
		db?: { table: string; write: string[] };
		response?: string[];
	};
	inferred?: boolean;
};

const LAYER_LABEL: Record<Layer, string> = {
	presentation: "Presentation",
	application: "Application",
	domain: "Domain",
	infrastructure: "Infrastructure",
};

const REPO_DOC_BASE = "https://github.com/younganswer/clean-ddd/blob/main";
const LAYER_ORDER: Layer[] = [
	"presentation",
	"application",
	"domain",
	"infrastructure",
];

const DOC_LINKS = [
	{
		label: "System at a Glance",
		href: `${REPO_DOC_BASE}/docs/system-at-a-glance.md`,
	},
	{
		label: "Data Flows",
		href: `${REPO_DOC_BASE}/docs/data-flows.md`,
	},
	{
		label: "Clean Architecture & DDD",
		href: `${REPO_DOC_BASE}/docs/clean-architecture-ddd.md`,
	},
	{
		label: "Backend README",
		href: `${REPO_DOC_BASE}/src/service/backend/README.md`,
	},
];

const STEPS: StepDef[] = [
	{
		id: "order-http",
		order: 1,
		label: "Create Order API accepted",
		layer: "presentation",
		method: "OrdersController.create",
		description: "POST /orders 요청이 수신되고 orderId가 반환됩니다.",
		flow: {
			from: "presentation",
			to: "application",
			payload: ["userId", "amount", "currency", "items"],
			response: ["orderId"],
		},
	},
	{
		id: "order-app",
		order: 2,
		label: "CreateOrderCommand handled",
		layer: "application",
		method: "CreateOrderHandler.execute",
		description: "애플리케이션 계층에서 주문 생성 유스케이스를 실행합니다.",
		flow: {
			from: "application",
			to: "domain",
			payload: ["CreateOrderCommand.input"],
		},
		inferred: true,
	},
	{
		id: "order-domain",
		order: 3,
		label: "Order aggregate built",
		layer: "domain",
		method: "Order aggregate",
		description: "도메인 규칙으로 주문 Aggregate와 Value Object가 구성됩니다.",
		flow: {
			from: "domain",
			to: "infrastructure",
			payload: ["Order aggregate", "OrderItem[]", "Money"],
		},
		inferred: true,
	},
	{
		id: "order-infra",
		order: 4,
		label: "Order persisted",
		layer: "infrastructure",
		method: "OrderRepository.create",
		description: "인프라 계층에서 주문이 DB에 저장됩니다.",
		flow: {
			from: "infrastructure",
			to: "presentation",
			payload: ["orders insert result"],
			db: {
				table: "orders",
				write: ["userId", "status", "amount", "currency", "items"],
			},
			response: ["orderId"],
		},
		inferred: true,
	},
	{
		id: "payment-http",
		order: 5,
		label: "Create PaymentIntent API accepted",
		layer: "presentation",
		method: "PaymentsController.create",
		description: "POST /orders/:id/payments/intents 요청이 수신됩니다.",
		flow: {
			from: "presentation",
			to: "application",
			payload: ["orderId(path)"],
		},
	},
	{
		id: "payment-app",
		order: 6,
		label: "Payment command orchestrated",
		layer: "application",
		method: "CreatePaymentIntentHandler.execute",
		description: "주문 조회, 결제 생성, 주문-결제 연결을 오케스트레이션합니다.",
		flow: {
			from: "application",
			to: "domain",
			payload: ["GetOrderQuery", "AttachPaymentToOrderCommand"],
		},
		inferred: true,
	},
	{
		id: "payment-domain",
		order: 7,
		label: "PaymentIntent status initialized",
		layer: "domain",
		method: "PaymentIntent aggregate",
		description: "결제 엔티티가 생성되고 초기 상태(PENDING)가 설정됩니다.",
		flow: {
			from: "domain",
			to: "infrastructure",
			payload: ["paymentId", "orderId", "status=PENDING"],
		},
	},
	{
		id: "payment-infra",
		order: 8,
		label: "Payment & order link persisted",
		layer: "infrastructure",
		method: "PaymentRepository + OrderRepository",
		description: "결제 저장과 주문 paymentId 연결이 인프라 레이어에서 반영됩니다.",
		flow: {
			from: "infrastructure",
			to: "presentation",
			payload: ["payment persistence", "order.paymentId update"],
			db: {
				table: "payment_intents + orders",
				write: ["paymentId", "orderId", "status", "orders.paymentId"],
			},
			response: ["paymentId", "status", "scheduled.outboxId"],
		},
		inferred: true,
	},
	{
		id: "outbox",
		order: 9,
		label: "Outbox message enqueued",
		layer: "infrastructure",
		method: "OutboxProducer.publish",
		description: "웹훅 이벤트가 Outbox에 기록되고 큐로 enqueue 됩니다.",
		flow: {
			from: "infrastructure",
			to: "infrastructure",
			payload: ["eventType", "delaySeconds", "outboxId"],
			db: {
				table: "outbox",
				write: ["outboxId", "eventType", "payload", "status=PENDING"],
			},
		},
		inferred: true,
	},
	{
		id: "saga",
		order: 10,
		label: "Webhook event consumed",
		layer: "application",
		method: "OutboxConsumer + Saga handlers",
		description: "큐 메시지를 소비하여 결제 결과를 반영하는 Saga가 실행됩니다.",
		flow: {
			from: "infrastructure",
			to: "application",
			payload: ["outbox message", "payment webhook event"],
			response: ["payment.status final", "order.status transition"],
		},
		inferred: true,
	},
	{
		id: "shipment",
		order: 11,
		label: "Shipment created",
		layer: "infrastructure",
		method: "CreateShipmentForOrderRequestedHandler",
		description: "결제 성공 경로에서 배송 생성 이벤트가 처리되어 Shipment가 생성됩니다.",
		flow: {
			from: "application",
			to: "infrastructure",
			payload: ["orderId", "shipment request event"],
			db: {
				table: "shipments",
				write: ["shipmentId", "orderId", "status=PENDING"],
			},
			response: ["shipmentId"],
		},
	},
];

function normalizeStatus(status: StepStatus): string {
	if (status === "idle") return "IDLE";
	if (status === "succeeded") return "SUCCEEDED";
	if (status === "failed") return "FAILED";
	if (status === "running") return "RUNNING";
	if (status === "skipped") return "SKIPPED";
	return "PENDING";
}

function formatPhaseLabel(phase: RunPhase): string {
	if (phase === "starting-order") return "STARTING_ORDER";
	if (phase === "order-ready") return "ORDER_READY";
	if (phase === "starting-payment") return "STARTING_PAYMENT";
	if (phase === "awaiting-payment") return "AWAITING_PAYMENT";
	if (phase === "awaiting-shipment") return "AWAITING_SHIPMENT";
	if (phase === "completed") return "COMPLETED";
	if (phase === "failed") return "FAILED";
	if (phase === "timeout") return "TIMEOUT";
	return "IDLE";
}

function deriveApiStepStatuses(input: {
	orderId: string;
	paymentId: string;
	outboxId: string;
	order: OrderDetail | null;
	payment: PaymentIntent | null;
	shipment: ShipmentSummary | null;
}): { statuses: Record<string, StepStatus> } {
	const hasOrderRequestAccepted = input.orderId.length > 0;
	const hasOrderData = Boolean(input.order);
	const hasPaymentRequestAccepted = input.paymentId.length > 0;
	const hasPaymentData = Boolean(input.payment);
	const hasOrderPaymentLink = Boolean(input.order?.paymentId);
	const hasOutboxId = input.outboxId.length > 0;
	const paymentSucceeded = input.payment?.status === "SUCCEEDED";
	const paymentFailed = input.payment?.status === "FAILED";
	const sagaFinalized = paymentSucceeded || paymentFailed;
	const shipmentCreated = Boolean(input.shipment);

	const successByStep: Record<string, boolean> = {
		"order-http": hasOrderRequestAccepted,
		"order-app": hasOrderData,
		"order-domain": hasOrderData,
		"order-infra": hasOrderData,
		"payment-http": hasPaymentRequestAccepted,
		"payment-app": hasPaymentRequestAccepted,
		"payment-domain": hasPaymentData,
		"payment-infra": hasOrderPaymentLink,
		outbox: hasOutboxId,
		saga: sagaFinalized,
		shipment: shipmentCreated,
	};

	const failedIndex = paymentFailed
		? STEPS.findIndex((step) => step.id === "saga")
		: -1;

	const statuses: Record<string, StepStatus> = {};
	for (let index = 0; index < STEPS.length; index += 1) {
		const step = STEPS[index];
		if (failedIndex >= 0) {
			if (index < failedIndex) {
				statuses[step.id] = successByStep[step.id]
					? "succeeded"
					: "pending";
				continue;
			}
			if (index === failedIndex) {
				statuses[step.id] = "failed";
				continue;
			}
			statuses[step.id] = "skipped";
			continue;
		}

		if (successByStep[step.id]) {
			statuses[step.id] = "succeeded";
			continue;
		}

		statuses[step.id] = "pending";
	}

	return { statuses };
}

export default function SystemConceptsPage() {
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [selectedUserId, setSelectedUserId] = useState("");
	const [selectedSku, setSelectedSku] = useState("");
	const [inputLoading, setInputLoading] = useState(true);

	const [phase, setPhase] = useState<RunPhase>("idle");
	const [orderId, setOrderId] = useState("");
	const [paymentId, setPaymentId] = useState("");
	const [outboxId, setOutboxId] = useState("");
	const [delaySeconds, setDelaySeconds] = useState<number | null>(null);
	const [order, setOrder] = useState<OrderDetail | null>(null);
	const [payment, setPayment] = useState<PaymentIntent | null>(null);
	const [shipment, setShipment] = useState<ShipmentSummary | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
	const [nowTick, setNowTick] = useState(() => Date.now());
	const [previewIndex, setPreviewIndex] = useState(0);
	const [completedUntil, setCompletedUntil] = useState(-1);
	const [completionAcknowledged, setCompletionAcknowledged] = useState(false);
	const [showCompletionSummary, setShowCompletionSummary] = useState(false);

	const isPolling =
		phase === "awaiting-payment" || phase === "awaiting-shipment";

	const { statuses: apiStatuses } = useMemo(
		() =>
			deriveApiStepStatuses({
				orderId,
				paymentId,
				outboxId,
				order,
				payment,
				shipment,
			}),
		[orderId, paymentId, outboxId, order, payment, shipment],
	);

	const maxNavigableIndex = useMemo(() => {
		if (!orderId) return 0;
		return STEPS.length - 1;
	}, [orderId]);

	const statuses = useMemo(() => {
		const next: Record<string, StepStatus> = {};
		const hasStarted = Boolean(orderId);
		const lastIndex = STEPS.length - 1;

		for (let index = 0; index < STEPS.length; index += 1) {
			const step = STEPS[index];
			const apiStatus = apiStatuses[step.id] ?? "pending";

			if (!hasStarted) {
				next[step.id] = "idle";
				continue;
			}

			if (!paymentId && index >= 4) {
				next[step.id] = "idle";
				continue;
			}

			if (apiStatus === "failed") {
				next[step.id] = "failed";
				continue;
			}

			if (apiStatus === "skipped") {
				next[step.id] = "skipped";
				continue;
			}

			if (index <= completedUntil) {
				next[step.id] = "succeeded";
				continue;
			}

			const isCurrent = !showCompletionSummary && index === previewIndex;
			if (isCurrent) {
				if (index === lastIndex && completionAcknowledged) {
					next[step.id] = "succeeded";
				} else {
					next[step.id] = "running";
				}
				continue;
			}

			next[step.id] = "pending";
		}

		return next;
	}, [
		apiStatuses,
		completedUntil,
		completionAcknowledged,
		orderId,
		paymentId,
		previewIndex,
		showCompletionSummary,
	]);

	const previewStep = STEPS[previewIndex] ?? STEPS[0];
	const canCreatePayment =
		Boolean(orderId) && statuses["order-infra"] === "succeeded";
	const isFlowCompleted =
		completionAcknowledged && statuses["shipment"] === "succeeded";
	const selectedUser = useMemo(
		() => users.find((user) => user.userId === selectedUserId) ?? null,
		[selectedUserId, users],
	);
	const selectedItem = useMemo(
		() => inventoryItems.find((item) => item.sku === selectedSku) ?? null,
		[selectedSku, inventoryItems],
	);
	const previewApiStatus = apiStatuses[previewStep.id] ?? "pending";
	const previewLabStatus = statuses[previewStep.id] ?? "pending";
	const canAcknowledgeCompletion = apiStatuses["shipment"] === "succeeded";
	const displayPhaseLabel = isFlowCompleted
		? "COMPLETED"
		: formatPhaseLabel(phase);
	const timeoutRemaining = useMemo(() => {
		if (!runStartedAt) return null;
		const elapsed = nowTick - runStartedAt;
		return Math.max(0, 60000 - elapsed);
	}, [nowTick, runStartedAt]);

	const refresh = useCallback(async () => {
		if (!orderId) return;
		setError(null);
		const nextOrder = await apiGetOrder(orderId);
		const resolvedPaymentId = paymentId || nextOrder.paymentId || "";
		const nextPayment = resolvedPaymentId
			? await apiGetPaymentIntent(resolvedPaymentId)
			: null;
		const nextShipment = await apiGetShipmentByOrderId(orderId);

		setOrder(nextOrder);
		setShipment(nextShipment);
		if (resolvedPaymentId) {
			setPaymentId(resolvedPaymentId);
		}
		setPayment(nextPayment);

		if (nextPayment?.status === "FAILED") {
			setPhase("failed");
			return;
		}

		if (nextPayment?.status === "SUCCEEDED" && nextOrder.status === "PAID") {
			if (nextShipment) {
				setPhase("completed");
				return;
			}
			setPhase("awaiting-shipment");
			return;
		}

		if (resolvedPaymentId) {
			setPhase("awaiting-payment");
		}
	}, [orderId, paymentId]);

	useEffect(() => {
		let active = true;
		void (async () => {
			setInputLoading(true);
			setError(null);
			try {
				const [userPage, itemPage] = await Promise.all([
					apiListUsers({ limit: 50, page: 1 }),
					apiListInventoryItems({ limit: 50, page: 1 }),
				]);
				if (!active) return;
				const nextUsers = userPage.items ?? [];
				const nextItems = itemPage.items ?? [];
				setUsers(nextUsers);
				setInventoryItems(nextItems);
				setSelectedUserId((prev) => prev || nextUsers[0]?.userId || "");
				setSelectedSku((prev) => prev || nextItems[0]?.sku || "");
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			} finally {
				if (!active) return;
				setInputLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const handleCreateOrder = useCallback(async () => {
		setError(null);
		setPhase("starting-order");
		setPaymentId("");
		setOutboxId("");
		setDelaySeconds(null);
		setPayment(null);
		setShipment(null);
		setRunStartedAt(null);
		setCompletedUntil(-1);
		setCompletionAcknowledged(false);
		setShowCompletionSummary(false);

		if (!selectedUser) {
			setError("선택 가능한 사용자가 없습니다.");
			setPhase("idle");
			return;
		}
		if (!selectedItem) {
			setError("선택 가능한 재고가 없습니다.");
			setPhase("idle");
			return;
		}
		if (selectedItem.availableQuantity < 1) {
			setError("선택한 재고의 가용 수량이 없습니다.");
			setPhase("idle");
			return;
		}
		try {
			const created = await apiCreateOrder({
				userId: selectedUser.userId,
				amount: selectedItem.price.amountMinor,
				currency: selectedItem.price.currency,
				items: [
					{
						sku: selectedItem.sku,
						quantity: 1,
					},
				],
			});
			const persistedOrder = await apiGetOrder(created.orderId);
			const persistedShipment = await apiGetShipmentByOrderId(created.orderId);
			setOrderId(created.orderId);
			setOrder(persistedOrder);
			setShipment(persistedShipment);
			setPreviewIndex(0);
			setCompletedUntil(-1);
			setShowCompletionSummary(false);
			setPhase("order-ready");
		} catch (e: unknown) {
			setPhase("idle");
			setOrderId("");
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
			return;
		}
	}, [selectedItem, selectedUser]);

	const handleCreatePaymentIntent = useCallback(async () => {
		if (!orderId) {
			setError("먼저 Order를 생성해 주세요.");
			return;
		}
		setError(null);
		setPhase("starting-payment");
		try {
			const created = await apiCreatePaymentIntent(orderId, {});
			setPaymentId(created.paymentId);
			setOutboxId(created.scheduled.outboxId);
			setDelaySeconds(created.scheduled.delaySeconds);
			setRunStartedAt(Date.now());
			setPhase("awaiting-payment");
			setPreviewIndex(4);
			setCompletionAcknowledged(false);
			setShowCompletionSummary(false);
			await refresh();
		} catch (e: unknown) {
			setPhase("order-ready");
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}, [orderId, refresh]);

	useEffect(() => {
		if (!orderId) return;
		if (phase === "completed" || phase === "failed" || phase === "timeout") {
			return;
		}
		if (phase !== "awaiting-payment" && phase !== "awaiting-shipment") {
			return;
		}
		const initialRefresh = window.setTimeout(() => {
			void refresh().catch((e: unknown) => {
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			});
		}, 0);
		const timer = window.setInterval(() => {
			void refresh().catch((e: unknown) => {
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			});
		}, 2000);
		return () => {
			window.clearTimeout(initialRefresh);
			window.clearInterval(timer);
		};
	}, [orderId, phase, refresh]);

	useEffect(() => {
		if (!runStartedAt) return;
		if (phase !== "awaiting-payment" && phase !== "awaiting-shipment") return;
		const timer = window.setInterval(() => {
			const now = Date.now();
			setNowTick(now);
			if (now - runStartedAt >= 60000) {
				setPhase("timeout");
			}
		}, 500);
		return () => {
			window.clearInterval(timer);
		};
	}, [phase, runStartedAt]);

	const handleSelectStep = useCallback((nextIndex: number) => {
		const lastIndex = STEPS.length - 1;
		if (
			nextIndex > lastIndex &&
			previewIndex === lastIndex &&
			apiStatuses["shipment"] === "succeeded"
		) {
			setCompletedUntil(lastIndex);
			setCompletionAcknowledged(true);
			setShowCompletionSummary(true);
			if (orderId) {
				void refresh().catch((e: unknown) => {
					const message = e instanceof Error ? e.message : String(e);
					setError(message);
				});
			}
			return;
		}

		const bounded = Math.max(0, Math.min(maxNavigableIndex, nextIndex));
		setCompletedUntil((prev) => Math.max(prev, bounded - 1));
		setPreviewIndex(bounded);
		setShowCompletionSummary(false);
		if (orderId) {
			void refresh().catch((e: unknown) => {
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			});
		}
	}, [apiStatuses, maxNavigableIndex, orderId, previewIndex, refresh]);

	const laneSteps = useMemo(() => {
		return {
			presentation: STEPS.filter((step) => step.layer === "presentation"),
			application: STEPS.filter((step) => step.layer === "application"),
			domain: STEPS.filter((step) => step.layer === "domain"),
			infrastructure: STEPS.filter(
				(step) => step.layer === "infrastructure",
			),
		};
	}, []);

	return (
		<div className="page-shell grid gap-6">
			<section className="surface p-6">
				<div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
					<div className="grid gap-1">
						<h1 className="text-2xl font-semibold">System Concepts</h1>
						<p className="text-sm text-muted-foreground">
							Learning Lab: PaymentIntent 생성이 백엔드 레이어를 통과하는
							 전 과정을 시뮬레이션합니다.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<StatusPill status={displayPhaseLabel} />
						{isPolling && <StatusPill status="POLLING" />}
					</div>
				</div>

				<div className="mt-4 grid gap-3 lg:grid-cols-2">
					<label className="grid gap-1">
						<span className="field-label">User</span>
						<select
							className="input"
							value={selectedUserId}
							disabled={inputLoading || users.length === 0}
							onChange={(e) => setSelectedUserId(e.target.value)}
						>
							{users.map((user) => (
								<option key={user.userId} value={user.userId}>
									{user.displayName} ({user.userId})
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-1">
						<span className="field-label">Inventory</span>
						<select
							className="input"
							value={selectedSku}
							disabled={inputLoading || inventoryItems.length === 0}
							onChange={(e) => setSelectedSku(e.target.value)}
						>
							{inventoryItems.map((item) => (
								<option key={item.itemId} value={item.sku}>
									{item.sku} · {item.price.amountMinor} {item.price.currency} · stock {item.availableQuantity}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-2">
					<button
						className="btn btn-primary"
						disabled={inputLoading || !selectedUser || !selectedItem}
						onClick={() => void handleCreateOrder()}
					>
						1) Create Order
					</button>
					<button
						className="btn btn-primary"
						disabled={!canCreatePayment}
						onClick={() => void handleCreatePaymentIntent()}
					>
						2) Create PaymentIntent
					</button>
					<button
						className="btn"
						disabled={!orderId}
						onClick={() => {
							void refresh().catch((e: unknown) => {
								const message = e instanceof Error ? e.message : String(e);
								setError(message);
							});
						}}
					>
						Refresh
					</button>
				</div>

				<div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
					<div className="surface-muted p-3">orderId: {orderId || "-"}</div>
					<div className="surface-muted p-3">paymentId: {paymentId || "-"}</div>
					<div className="surface-muted p-3">outboxId: {outboxId || "-"}</div>
					<div className="surface-muted p-3">
						delaySeconds: {delaySeconds === null ? "-" : delaySeconds}
					</div>
				</div>

				<div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
					<div className="surface-muted p-3">
						selected.user: {selectedUser?.displayName ?? "-"}
					</div>
					<div className="surface-muted p-3">
						selected.sku: {selectedItem?.sku ?? "-"}
					</div>
					<div className="surface-muted p-3">
						order.status: {order?.status ?? "-"}
					</div>
					<div className="surface-muted p-3">
						payment.status: {payment?.status ?? "-"}
					</div>
					<div className="surface-muted p-3">shipment.status: {shipment?.status ?? "-"}</div>
					<div className="surface-muted p-3">timeout(60s): {timeoutRemaining === null ? "-" : `${Math.ceil(timeoutRemaining / 1000)}s`}</div>
				</div>

				{error && <div className="mt-3 text-sm text-danger">{error}</div>}
			</section>

			<section className="surface p-6">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-lg font-semibold">Step Preview</h2>
					<div className="flex items-center gap-2">
						<button
							className="btn"
							disabled={showCompletionSummary ? false : previewIndex <= 0}
							onClick={() => {
								if (showCompletionSummary) {
									setShowCompletionSummary(false);
									setPreviewIndex(STEPS.length - 1);
									return;
								}
								handleSelectStep(previewIndex - 1);
							}}
						>
							Prev
						</button>
						<button
							className="btn"
							disabled={
								showCompletionSummary ||
								(previewIndex >= STEPS.length - 1 && !canAcknowledgeCompletion)
							}
							onClick={() => handleSelectStep(previewIndex + 1)}
						>
							Next
						</button>
					</div>
				</div>

				{showCompletionSummary ? (
					<div className="mt-4 surface-muted p-4">
						<div className="text-xs text-muted-foreground">Execution Summary</div>
						<div className="mt-1 text-base font-semibold">
							PaymentIntent 파이프라인 학습 흐름이 완료되었습니다.
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Order 생성부터 PaymentIntent 처리, Outbox/Saga, Shipment 생성까지
							 모든 스텝을 확인했습니다.
						</p>
						<div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
							<div className="surface p-3">orderId: {orderId || "-"}</div>
							<div className="surface p-3">paymentId: {paymentId || "-"}</div>
							<div className="surface p-3">outboxId: {outboxId || "-"}</div>
							<div className="surface p-3">shipmentId: {shipment?.shipmentId ?? "-"}</div>
						</div>
					</div>
				) : (
					<div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
					<div className="surface-muted p-4">
						<div className="text-xs text-muted-foreground">
							Step #{previewStep.order} · {LAYER_LABEL[previewStep.layer]}
						</div>
						<div className="mt-1 text-base font-semibold">{previewStep.label}</div>
						<div className="mt-1 text-sm text-muted-foreground">{previewStep.method}</div>
						<p className="mt-2 text-sm text-muted-foreground">
							{previewStep.description}
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<StatusPill status={normalizeStatus(previewLabStatus)} />
							<span className="status-pill status-neutral">
								API {normalizeStatus(previewApiStatus)}
							</span>
							{previewStep.inferred && (
								<span className="status-pill status-neutral">Inferred</span>
							)}
						</div>
					</div>

					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Data Movement
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
							{LAYER_ORDER.map((layer, index) => {
								const active =
									layer === previewStep.flow.from || layer === previewStep.flow.to;
								return (
									<div key={layer} className="flex items-center gap-2">
										<span
											className={`rounded-full border px-2 py-1 ${active ? "border-accent text-foreground" : "border-border text-muted-foreground"}`}
										>
											{LAYER_LABEL[layer]}
										</span>
										{index < LAYER_ORDER.length - 1 && (
											<span className="text-muted-foreground">→</span>
										)}
									</div>
								);
							})}
						</div>
						<div className="mt-3 text-xs text-muted-foreground">
							{LAYER_LABEL[previewStep.flow.from]} → {LAYER_LABEL[previewStep.flow.to]}
						</div>
						<div className="mt-1 text-sm">
							Payload: {previewStep.flow.payload.join(", ") || "-"}
						</div>
						<div className="mt-2 text-sm">
							DB Write: {previewStep.flow.db ? `${previewStep.flow.db.table} (${previewStep.flow.db.write.join(", ")})` : "-"}
						</div>
						<div className="mt-1 text-sm">
							Response: {previewStep.flow.response?.join(", ") || "-"}
						</div>
					</div>
					</div>
				)}
			</section>

			<section className="grid gap-3 lg:grid-cols-4">
				{LAYER_ORDER.map((layer) => (
					<div key={layer} className="surface p-4">
						<div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							{LAYER_LABEL[layer]}
						</div>
						<div className="grid gap-2">
							{laneSteps[layer].map((step) => {
								const status = statuses[step.id] ?? "pending";
								const apiStatus = apiStatuses[step.id] ?? "pending";
								const stepIndex = STEPS.findIndex((item) => item.id === step.id);
								const isCurrent = !showCompletionSummary && previewIndex === stepIndex;
								return (
									<button
										type="button"
										key={step.id}
										onClick={() => handleSelectStep(stepIndex)}
										className={`surface-muted p-3 text-left ${isCurrent ? "ring-2 ring-ring" : ""}`}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="text-xs font-medium">#{step.order}</span>
											<StatusPill status={normalizeStatus(status)} />
										</div>
										<div className="mt-1 text-[11px] text-muted-foreground">
											API: {normalizeStatus(apiStatus)}
										</div>
										<div className="mt-1 text-sm font-medium">{step.label}</div>
										<div className="mt-1 text-xs text-muted-foreground">{step.method}</div>
										{step.inferred && (
											<div className="mt-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
												Inferred
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</section>

			<section className="surface p-6">
				<h2 className="text-lg font-semibold">Concept Docs</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					백엔드 설계 개념은 아래 문서에서 확인할 수 있습니다.
				</p>
				<div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
					{DOC_LINKS.map((doc) => (
						<Link
							key={doc.href}
							href={doc.href}
							target="_blank"
							rel="noopener noreferrer"
							className="surface-muted flex items-center justify-between px-3 py-2 text-sm"
						>
							<span>{doc.label}</span>
							<span className="text-xs text-muted-foreground">External</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
