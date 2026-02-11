const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function requireBaseUrl(): string {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
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
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

export type OrderSummary = {
  orderId: string;
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
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export async function apiCreateOrder(input: { amount: number; currency: "KRW" | "USD" }): Promise<{ orderId: string }> {
  return http("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiListOrders(input: { limit: number }): Promise<OrderSummary[]> {
  return http(`/orders?limit=${encodeURIComponent(String(input.limit))}`);
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

export async function apiListShipments(input: { limit: number }): Promise<ShipmentSummary[]> {
  return http(`/shipments?limit=${encodeURIComponent(String(input.limit))}`);
}

export async function apiGetShipmentByOrderId(orderId: string): Promise<ShipmentSummary | null> {
  return http(`/shipments/by-order/${encodeURIComponent(orderId)}`);
}

export async function apiListInventoryItems(input: { limit: number }): Promise<InventoryItem[]> {
  return http(`/inventory/items?limit=${encodeURIComponent(String(input.limit))}`);
}

export async function apiGetInventoryItem(sku: string): Promise<InventoryItem | null> {
  return http(`/inventory/items/${encodeURIComponent(sku)}`);
}

export async function apiListInventoryReservations(orderId: string): Promise<
  Array<{ reservationId: string; orderId: string; sku: string; quantity: number; createdAt: string }>
> {
  return http(`/inventory/reservations?orderId=${encodeURIComponent(orderId)}`);
}
