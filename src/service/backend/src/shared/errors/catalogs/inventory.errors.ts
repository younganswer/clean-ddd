import { ErrorTemplate } from '@/common/errors/error-template.type';

export const INVENTORY_DOMAIN_ERRORS = {
	INVENTORY_QUANTITY_INVALID: {
		code: 'INVENTORY_QUANTITY_INVALID',
		message: 'quantity must be positive',
		status: 400,
	},
	INVENTORY_STOCK_INSUFFICIENT: {
		code: 'INVENTORY_STOCK_INSUFFICIENT',
		message: 'insufficient stock',
		status: 409,
	},
	INVENTORY_RELEASE_QUANTITY_EXCEEDS_RESERVED: {
		code: 'INVENTORY_RELEASE_QUANTITY_EXCEEDS_RESERVED',
		message: 'release quantity exceeds reserved quantity',
		status: 409,
	},
	INVENTORY_RESERVATION_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_RESERVATION_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: 400,
	},
	INVENTORY_RESERVATION_SKU_REQUIRED: {
		code: 'INVENTORY_RESERVATION_SKU_REQUIRED',
		message: 'sku is required',
		status: 400,
	},
	INVENTORY_RESERVATION_QUANTITY_INVALID: {
		code: 'INVENTORY_RESERVATION_QUANTITY_INVALID',
		message: 'quantity must be a positive number',
		status: 400,
	},
	INVENTORY_RESERVATION_ID_REQUIRED: {
		code: 'INVENTORY_RESERVATION_ID_REQUIRED',
		message: 'reservation uuid is required',
		status: 400,
	},
	INVENTORY_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: 400,
	},
	INVENTORY_RESERVE_ITEMS_INVALID: {
		code: 'INVENTORY_RESERVE_ITEMS_INVALID',
		message: 'invalid reserve items',
		status: 400,
	},
	INVENTORY_ITEM_NOT_FOUND: {
		code: 'INVENTORY_ITEM_NOT_FOUND',
		message: 'inventory item not found',
		status: 404,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const INVENTORY_APPLICATION_ERRORS = {
	INVENTORY_EVENT_PAYLOAD_INVALID: {
		code: 'INVENTORY_EVENT_PAYLOAD_INVALID',
		message: 'invalid inventory payload',
		status: 400,
	},
	INVENTORY_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: 400,
	},
} as const satisfies Record<string, ErrorTemplate>;
