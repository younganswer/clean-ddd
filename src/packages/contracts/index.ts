import type { components } from "./types.generated";

export type ContractSchemas = components["schemas"];

export type Paginated<TItem> = {
	items: TItem[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
};

export type UserProfile = ContractSchemas["UserProfile"];
export type OrderSummary = ContractSchemas["OrderSummary"];
export type OrderDetail = OrderSummary;
export type ShipmentSummary = ContractSchemas["ShipmentSummary"];
export type InventoryItem = ContractSchemas["InventoryItem"];
export type InventoryReservation = ContractSchemas["InventoryReservation"];

export type CreateOrderRequest = ContractSchemas["CreateOrderRequest"];
export type CreateOrderResponse = ContractSchemas["CreateOrderResponse"];
export type CreatePaymentIntentRequest =
	ContractSchemas["CreatePaymentIntentRequest"];
export type CreatePaymentIntentResponse =
	ContractSchemas["CreatePaymentIntentResponse"];
export type PaymentIntent = ContractSchemas["PaymentIntent"];

export type PaginatedOrders = ContractSchemas["PaginatedOrders"];
export type PaginatedUsers = ContractSchemas["PaginatedUserProfiles"];
export type PaginatedShipments = ContractSchemas["PaginatedShipments"];
export type PaginatedInventoryItems =
	ContractSchemas["PaginatedInventoryItems"];
