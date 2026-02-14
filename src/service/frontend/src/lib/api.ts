const baseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL ??
	process.env.NEXT_PUBLIC_API_URL ??
	"/api/v1";

function requireBaseUrl(): string {
	if (!baseUrl) {
		throw new Error(
			"NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) is required",
		);
	}
	return baseUrl.replace(/\/$/, "");
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
	const url = `${requireBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
	const res = await fetch(url, {
		...init,
		headers: {
			"content-type": "application/json",
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
	return (await res.json()) as T;
}

export type OrderSummary = {
	orderId: string;
	userId: string;
	status: string;
	amount: number;
	currency: string;
	items?: Array<{ sku: string; quantity: number }>;
	paymentId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type OrderDetail = OrderSummary;

export type ShipmentSummary = {
	shipmentId: string;
	orderId: string;
	status: string;
	createdAt: string;
	updatedAt: string;
};

export type InventoryItem = {
	itemId: string;
	sku: string;
	price: {
		currency: string;
		amountMinor: number;
	};
	availableQuantity: number;
	reservedQuantity: number;
	createdAt: string;
	updatedAt: string;
};

export type Paginated<TItem> = {
	items: TItem[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
};

export type UserProfile = {
	userId: string;
	displayName: string;
	email: string;
	avatarUrl?: string;
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

export async function apiCreateOrder(input: {
	userId: string;
	amount: number;
	currency: "KRW" | "USD";
	items?: Array<{ sku: string; quantity: number }>;
}): Promise<{ orderId: string }> {
	return http("/orders", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function apiListOrders(input: {
	limit: number;
	page?: number;
}): Promise<Paginated<OrderSummary>> {
	const page = input.page ?? 1;
	return http(
		`/orders?limit=${encodeURIComponent(String(input.limit))}&page=${encodeURIComponent(String(page))}`,
	);
}

export async function apiGetOrder(orderId: string): Promise<OrderDetail> {
	return http(`/orders/${encodeURIComponent(orderId)}`);
}

export async function apiCreatePaymentIntent(
	orderId: string,
	input: { simulateOutcome?: "SUCCEEDED" | "FAILED" },
): Promise<any> {
	return http(`/orders/${encodeURIComponent(orderId)}/payments/intents`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function apiListShipments(input: {
	limit: number;
	page?: number;
}): Promise<Paginated<ShipmentSummary>> {
	const page = input.page ?? 1;
	return http(
		`/shipments?limit=${encodeURIComponent(String(input.limit))}&page=${encodeURIComponent(String(page))}`,
	);
}

export async function apiGetShipmentByOrderId(
	orderId: string,
): Promise<ShipmentSummary | null> {
	return http(`/shipments/by-order/${encodeURIComponent(orderId)}`);
}

export async function apiListInventoryItems(input: {
	limit: number;
	page?: number;
}): Promise<Paginated<InventoryItem>> {
	const page = input.page ?? 1;
	return http(
		`/inventory/items?limit=${encodeURIComponent(String(input.limit))}&page=${encodeURIComponent(String(page))}`,
	);
}

export async function apiGetInventoryItem(
	sku: string,
): Promise<InventoryItem | null> {
	return http(`/inventory/items/${encodeURIComponent(sku)}`);
}

export async function apiListInventoryReservations(orderId: string): Promise<
	Array<{
		reservationId: string;
		orderId: string;
		sku: string;
		quantity: number;
		createdAt: string;
	}>
> {
	return http(
		`/inventory/reservations?orderId=${encodeURIComponent(orderId)}`,
	);
}

export async function apiListUsers(input: {
	limit: number;
	page: number;
}): Promise<Paginated<UserProfile>> {
	return http(
		`/users?limit=${encodeURIComponent(String(input.limit))}&page=${encodeURIComponent(String(input.page))}`,
	);
}

export async function apiGetGraph(input: {
	rootType: "USER" | "ORDER" | "SHIPMENT" | "PAYMENT";
	rootId: string;
	depth?: number;
	maxEvents?: number;
	maxNodes?: number;
	includeEvents?: boolean;
}): Promise<GraphView> {
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
}
