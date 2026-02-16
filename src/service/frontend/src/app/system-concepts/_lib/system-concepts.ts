import type { OrderDetail, PaymentIntent, ShipmentSummary } from "@/lib/api";

export type Layer =
	| "presentation"
	| "application"
	| "domain"
	| "infrastructure";
export type StepStatus =
	| "idle"
	| "pending"
	| "running"
	| "succeeded"
	| "failed"
	| "skipped";
export type RunPhase =
	| "idle"
	| "starting-order"
	| "order-ready"
	| "starting-payment"
	| "awaiting-payment"
	| "awaiting-shipment"
	| "completed"
	| "failed"
	| "timeout";

export type StepDef = {
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

export const LAYER_LABEL: Record<Layer, string> = {
	presentation: "Presentation",
	application: "Application",
	domain: "Domain",
	infrastructure: "Infrastructure",
};

const REPO_DOC_BASE = "https://github.com/younganswer/clean-ddd/blob/main";
export const LAYER_ORDER: Layer[] = [
	"presentation",
	"application",
	"domain",
	"infrastructure",
];

export const DOC_LINKS = [
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

export const STEPS: StepDef[] = [
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
		description:
			"도메인 규칙으로 주문 Aggregate와 Value Object가 구성됩니다.",
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
		description:
			"주문 조회, 결제 생성, 주문-결제 연결을 오케스트레이션합니다.",
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
		description:
			"결제 저장과 주문 paymentId 연결이 인프라 레이어에서 반영됩니다.",
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
		description:
			"큐 메시지를 소비하여 결제 결과를 반영하는 Saga가 실행됩니다.",
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
		description:
			"결제 성공 경로에서 배송 생성 이벤트가 처리되어 Shipment가 생성됩니다.",
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

export function normalizeStatus(status: StepStatus): string {
	if (status === "idle") return "IDLE";
	if (status === "succeeded") return "SUCCEEDED";
	if (status === "failed") return "FAILED";
	if (status === "running") return "RUNNING";
	if (status === "skipped") return "SKIPPED";
	return "PENDING";
}

export function formatPhaseLabel(phase: RunPhase): string {
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

export function deriveApiStepStatuses(input: {
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

export function buildLaneSteps() {
	return {
		presentation: STEPS.filter((step) => step.layer === "presentation"),
		application: STEPS.filter((step) => step.layer === "application"),
		domain: STEPS.filter((step) => step.layer === "domain"),
		infrastructure: STEPS.filter((step) => step.layer === "infrastructure"),
	};
}
