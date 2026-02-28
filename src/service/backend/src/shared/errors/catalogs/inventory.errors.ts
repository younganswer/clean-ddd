import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const INVENTORY_DOMAIN_ERRORS = {
	INVENTORY_QUANTITY_INVALID: {
		code: 'INVENTORY_QUANTITY_INVALID',
		message: 'quantity must be positive',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_STOCK_INSUFFICIENT: {
		code: 'INVENTORY_STOCK_INSUFFICIENT',
		message: 'insufficient stock',
		status: HttpStatus.CONFLICT,
	},
	INVENTORY_RESERVATION_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_RESERVATION_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_RESERVATION_SKU_REQUIRED: {
		code: 'INVENTORY_RESERVATION_SKU_REQUIRED',
		message: 'sku is required',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_RESERVATION_QUANTITY_INVALID: {
		code: 'INVENTORY_RESERVATION_QUANTITY_INVALID',
		message: 'quantity must be a positive number',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_RESERVATION_ID_REQUIRED: {
		code: 'INVENTORY_RESERVATION_ID_REQUIRED',
		message: 'reservation uuid is required',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_RESERVE_ITEMS_INVALID: {
		code: 'INVENTORY_RESERVE_ITEMS_INVALID',
		message: 'invalid reserve items',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_ITEM_NOT_FOUND: {
		code: 'INVENTORY_ITEM_NOT_FOUND',
		message: 'inventory item not found',
		status: HttpStatus.NOT_FOUND,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const INVENTORY_APPLICATION_ERRORS = {
	INVENTORY_EVENT_PAYLOAD_INVALID: {
		code: 'INVENTORY_EVENT_PAYLOAD_INVALID',
		message: 'invalid inventory payload',
		status: HttpStatus.BAD_REQUEST,
	},
	INVENTORY_ORDER_ID_REQUIRED: {
		code: 'INVENTORY_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;
