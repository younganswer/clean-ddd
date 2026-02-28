import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const ORDERING_DOMAIN_ERRORS = {
	ORDER_USER_ID_REQUIRED: {
		code: 'ORDER_USER_ID_REQUIRED',
		message: 'userId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_ITEMS_REQUIRED: {
		code: 'ORDER_ITEMS_REQUIRED',
		message: 'order must contain at least one item',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_PAYMENT_ID_REQUIRED: {
		code: 'ORDER_PAYMENT_ID_REQUIRED',
		message: 'paymentId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_PAYMENT_ALREADY_ATTACHED: {
		code: 'ORDER_PAYMENT_ALREADY_ATTACHED',
		message: 'paymentId is already attached',
		status: HttpStatus.CONFLICT,
	},
	ORDER_PAYMENT_ATTACH_INVALID_STATUS: {
		code: 'ORDER_PAYMENT_ATTACH_INVALID_STATUS',
		message: 'cannot attach payment in current status',
		status: HttpStatus.CONFLICT,
	},
	ORDER_MARK_PAID_INVALID_STATUS: {
		code: 'ORDER_MARK_PAID_INVALID_STATUS',
		message: 'cannot mark paid in current status',
		status: HttpStatus.CONFLICT,
	},
	ORDER_PAYMENT_NOT_ATTACHED: {
		code: 'ORDER_PAYMENT_NOT_ATTACHED',
		message: 'cannot mark paid before payment is attached',
		status: HttpStatus.CONFLICT,
	},
	MONEY_AMOUNT_INVALID: {
		code: 'MONEY_AMOUNT_INVALID',
		message: 'amount must be a positive number',
		status: HttpStatus.BAD_REQUEST,
	},
	MONEY_CURRENCY_REQUIRED: {
		code: 'MONEY_CURRENCY_REQUIRED',
		message: 'currency is required',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_ITEM_SKU_REQUIRED: {
		code: 'ORDER_ITEM_SKU_REQUIRED',
		message: 'sku is required',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_ITEM_QUANTITY_INVALID: {
		code: 'ORDER_ITEM_QUANTITY_INVALID',
		message: 'quantity must be a positive number',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const ORDERING_APPLICATION_ERRORS = {
	ORDER_ID_REQUIRED: {
		code: 'ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	PAYMENT_ID_REQUIRED: {
		code: 'PAYMENT_ID_REQUIRED',
		message: 'paymentId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	ORDER_NOT_FOUND: {
		code: 'ORDER_NOT_FOUND',
		message: 'order not found',
		status: HttpStatus.NOT_FOUND,
	},
} as const satisfies Record<string, ErrorTemplate>;
