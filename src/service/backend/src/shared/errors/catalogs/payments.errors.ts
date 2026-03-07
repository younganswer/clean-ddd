import { ErrorTemplate } from '@/common/errors/error-template.type';

export const PAYMENTS_DOMAIN_ERRORS = {
	PAYMENT_MARK_SUCCEEDED_INVALID_STATUS: {
		code: 'PAYMENT_MARK_SUCCEEDED_INVALID_STATUS',
		message: 'cannot mark payment succeeded when status is invalid',
		status: 409,
	},
	PAYMENT_MARK_FAILED_INVALID_STATUS: {
		code: 'PAYMENT_MARK_FAILED_INVALID_STATUS',
		message: 'cannot mark payment failed when status is invalid',
		status: 409,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const PAYMENTS_APPLICATION_ERRORS = {
	PAYMENT_ORDER_ID_REQUIRED: {
		code: 'PAYMENT_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: 400,
	},
	PAYMENTS_RESULT_INVALID: {
		code: 'PAYMENTS_RESULT_INVALID',
		message: 'invalid payments result',
		status: 500,
	},
	PAYMENT_INTENT_RESULT_INVALID: {
		code: 'PAYMENT_INTENT_RESULT_INVALID',
		message: 'invalid payment intent result',
		status: 500,
	},
	PAYMENT_WEBHOOK_PAYLOAD_INVALID: {
		code: 'PAYMENT_WEBHOOK_PAYLOAD_INVALID',
		message: 'invalid webhook payload',
		status: 400,
	},
	PAYMENT_NOT_FOUND: {
		code: 'PAYMENT_NOT_FOUND',
		message: 'payment not found',
		status: 404,
	},
	ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION: {
		code: 'ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION',
		message: 'cannot request inventory reservation without order items',
		status: 400,
	},
} as const satisfies Record<string, ErrorTemplate>;
