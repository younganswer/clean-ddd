import type {
	CreateOrderRequest,
	CreateOrderResponse,
	CreatePaymentIntentRequest,
	CreatePaymentIntentResponse,
	InventoryItem,
	InventoryReservation,
	OrderDetail,
	OrderSummary,
	PaymentIntent,
	PaginatedInventoryItems,
	PaginatedOrders,
	PaginatedShipments,
	PaginatedUsers,
	ShipmentSummary,
	UserProfile,
} from "@clean-ddd/contracts";

export type {
	CreatePaymentIntentResponse,
	InventoryItem,
	InventoryReservation,
	OrderDetail,
	OrderSummary,
	PaymentIntent,
	ShipmentSummary,
	UserProfile,
};

const baseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL ??
	process.env.NEXT_PUBLIC_API_URL ??
	"/api/v1";

const requireBaseUrl = (): string => {
	if (!baseUrl) {
		throw new Error(
			"NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) is required",
		);
	}
	return baseUrl.replace(/\/$/, "");
};

const toApiPath = (path: string): string =>
	path.startsWith("/") ? path : `/${path}`;

const toQueryString = (
	params: Record<string, string | number | boolean | undefined>,
): string => {
	const query = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (typeof value === "undefined") {
			continue;
		}

		query.set(key, String(value));
	}

	return query.toString();
};

type ApiEnvelope<TData> = {
	success: boolean;
	data: TData;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const isEnvelope = (value: unknown): value is ApiEnvelope<unknown> => {
	return (
		isRecord(value) && typeof value.success === "boolean" && "data" in value
	);
};

const unwrapApiResponse = <T>(value: unknown, path: string): T => {
	if (!isEnvelope(value)) {
		return value as T;
	}

	if (value.success) {
		return value.data as T;
	}

	const detail =
		isRecord(value.data) && typeof value.data.detail === "string"
			? value.data.detail
			: "API response success=false";
	throw new Error(`${detail} (${path})`);
};

const http = async <T>(path: string, init?: RequestInit): Promise<T> => {
	const url = `${requireBaseUrl()}${toApiPath(path)}`;
	const method = (init?.method ?? "GET").toUpperCase();
	const hasBody = init?.body !== undefined && init?.body !== null;
	const defaultHeaders: Record<string, string> = {};

	if (hasBody && method !== "GET" && method !== "HEAD") {
		defaultHeaders["content-type"] = "application/json";
	}

	const res = await fetch(url, {
		...init,
		headers: {
			...defaultHeaders,
			...(init?.headers ?? {}),
		},
		cache: "no-store",
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
		);
	}

	if (res.status === 204) {
		return null as T;
	}

	const text = await res.text();
	if (!text.trim()) {
		return null as T;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(`Invalid JSON response for ${path}`);
	}

	return unwrapApiResponse<T>(parsed, path);
};

export type Paginated<TItem> = {
	items: TItem[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
};

export type GraphNode = {
	id: string;
	type: "USER" | "ORDER" | "SHIPMENT" | "PAYMENT" | "EVENT";
	label: string;
	data?: Record<string, unknown>;
};

export type GraphEdge = {
	id: string;
	from: string;
	to: string;
	type: "OWNS" | "REFERENCES" | "EMITS";
	label?: string;
};

export type GraphView = {
	rootNodeId: string;
	nodes: GraphNode[];
	edges: GraphEdge[];
	truncated?: boolean;
};

export const apiCreateOrder = async (input: {
	userId: string;
	amount: number;
	currency: "KRW" | "USD";
	items?: Array<{ sku: string; quantity: number }>;
}): Promise<CreateOrderResponse> => {
	return http("/orders", {
		method: "POST",
		body: JSON.stringify(input satisfies CreateOrderRequest),
	});
};

export const apiListOrders = async (input: {
	limit: number;
	page?: number;
}): Promise<PaginatedOrders> => {
	const page = input.page ?? 1;
	const query = toQueryString({
		limit: input.limit,
		page,
	});
	return http(`/orders?${query}`);
};

export const apiGetOrder = async (orderId: string): Promise<OrderDetail> => {
	return http(`/orders/${encodeURIComponent(orderId)}`);
};

export const apiCreatePaymentIntent = async (
	orderId: string,
	input: { simulateOutcome?: "SUCCEEDED" | "FAILED" },
): Promise<CreatePaymentIntentResponse> => {
	return http(`/orders/${encodeURIComponent(orderId)}/payments/intents`, {
		method: "POST",
		body: JSON.stringify(input satisfies CreatePaymentIntentRequest),
	});
};

export const apiGetPaymentIntent = async (
	paymentId: string,
): Promise<PaymentIntent> => {
	return http(`/payments/intents/${encodeURIComponent(paymentId)}`);
};

export const apiListShipments = async (input: {
	limit: number;
	page?: number;
}): Promise<PaginatedShipments> => {
	const page = input.page ?? 1;
	const query = toQueryString({
		limit: input.limit,
		page,
	});
	return http(`/shipments?${query}`);
};

export const apiGetShipmentByOrderId = async (
	orderId: string,
): Promise<ShipmentSummary | null> => {
	return http(`/shipments/by-order/${encodeURIComponent(orderId)}`);
};

export const apiListInventoryItems = async (input: {
	limit: number;
	page?: number;
}): Promise<PaginatedInventoryItems> => {
	const page = input.page ?? 1;
	const query = toQueryString({
		limit: input.limit,
		page,
	});
	return http(`/inventory/items?${query}`);
};

export const apiGetInventoryItem = async (
	sku: string,
): Promise<InventoryItem | null> => {
	return http(`/inventory/items/${encodeURIComponent(sku)}`);
};

export const apiListInventoryReservations = async (
	orderId: string,
): Promise<InventoryReservation[]> => {
	const query = toQueryString({
		orderId,
	});
	return http(`/inventory/reservations?${query}`);
};

export const apiListUsers = async (input: {
	limit: number;
	page: number;
}): Promise<PaginatedUsers> => {
	const query = toQueryString({
		limit: input.limit,
		page: input.page,
	});
	return http(`/users?${query}`);
};

export const apiGetSystemConceptsBootstrap = async (input: {
	limit: number;
	page: number;
}): Promise<{
	users: PaginatedUsers;
	inventoryItems: PaginatedInventoryItems;
}> => {
	const query = toQueryString({
		limit: input.limit,
		page: input.page,
	});
	return http(`/bff/system-concepts/bootstrap?${query}`);
};

export const apiGetGraph = async (input: {
	rootType: "USER" | "ORDER" | "SHIPMENT" | "PAYMENT";
	rootId: string;
	depth?: number;
	maxEvents?: number;
	maxNodes?: number;
	includeEvents?: boolean;
}): Promise<GraphView> => {
	const params = new URLSearchParams({
		rootType: input.rootType,
		rootId: input.rootId,
	});
	if (typeof input.depth === "number") {
		params.set("depth", String(input.depth));
	}
	if (typeof input.maxEvents === "number") {
		params.set("maxEvents", String(input.maxEvents));
	}
	if (typeof input.maxNodes === "number") {
		params.set("maxNodes", String(input.maxNodes));
	}
	if (typeof input.includeEvents === "boolean") {
		params.set("includeEvents", String(input.includeEvents));
	}
	return http(`/bff/graph?${params.toString()}`);
};
